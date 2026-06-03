import uuid
import os
import shutil
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.paper import Paper, Analysis
from app.services import pdf_service, groq_service


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


async def save_paper_file(file_bytes: bytes, original_filename: str) -> tuple[str, str]:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{original_filename}"
    dest = os.path.join(UPLOAD_DIR, unique_name)
    with open(dest, "wb") as f:
        f.write(file_bytes)
    return dest, unique_name


async def create_paper(db: AsyncSession, file_path: str, file_name: str, user_id: str) -> Paper:
    paper = Paper(
        title=file_name,
        file_name=file_name,
        file_path=file_path,
        status="pending",
        user_id=user_id,
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    return paper


async def process_paper(paper_id: str, file_path: str):
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Paper).where(Paper.id == paper_id))
        paper = result.scalar_one_or_none()
        if not paper:
            return

        try:
            paper.status = "processing"
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()

            extracted = pdf_service.extract_pdf(file_path)
            paper.title = extracted["title"] or paper.file_name
            paper.authors = extracted["authors"]
            paper.abstract = extracted["abstract"]
            paper.content = extracted["content"]
            paper.page_count = extracted["page_count"]
            paper.file_size = extracted["file_size"]
            await db.commit()

            if extracted["content"]:
                summary = groq_service.generate_summary(extracted["content"])
                paper.summary = summary

            paper.status = "processed"
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            paper.status = "error"
            paper.error_message = str(e)
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def get_all_papers(db: AsyncSession, user_id: str) -> list[Paper]:
    result = await db.execute(
        select(Paper).where(Paper.user_id == user_id).order_by(Paper.created_at.desc())
    )
    return result.scalars().all()


async def get_paper(db: AsyncSession, paper_id: str, user_id: str) -> Paper | None:
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id, Paper.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def delete_paper(db: AsyncSession, paper_id: str, user_id: str) -> bool:
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id, Paper.user_id == user_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        return False
    if paper.file_path and os.path.exists(paper.file_path):
        os.remove(paper.file_path)
    await db.execute(delete(Paper).where(Paper.id == paper_id, Paper.user_id == user_id))
    await db.commit()
    return True


async def retrigger_summary(paper_id: str):
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Paper).where(Paper.id == paper_id))
        paper = result.scalar_one_or_none()
        if not paper or not paper.content:
            return
        try:
            paper.status = "processing"
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()

            summary = groq_service.generate_summary(paper.content)
            paper.summary = summary
            paper.status = "processed"
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()
        except Exception as e:
            paper.status = "error"
            paper.error_message = str(e)
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def create_analysis(
    db: AsyncSession, analysis_type: str, paper_ids: list[str], user_id: str
) -> Analysis:
    result = await db.execute(
        select(Paper).where(Paper.id.in_(paper_ids), Paper.user_id == user_id)
    )
    papers = result.scalars().all()
    if len(papers) < 2:
        raise ValueError("Need at least 2 papers for analysis")

    papers_data = [
        {
            "title": p.title,
            "authors": p.authors or [],
            "summary": p.summary,
            "content": p.content,
        }
        for p in papers
    ]

    if analysis_type == "comparative":
        result_text = groq_service.generate_comparative(papers_data)
    elif analysis_type == "synthetic_review":
        result_text = groq_service.generate_synthetic_review(papers_data)
    else:
        raise ValueError(f"Unknown analysis type: {analysis_type}")

    analysis = Analysis(
        type=analysis_type,
        paper_ids=[str(p.id) for p in papers],
        paper_titles=[p.title for p in papers],
        result=result_text,
        user_id=user_id,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


async def get_all_analyses(db: AsyncSession, user_id: str) -> list[Analysis]:
    result = await db.execute(
        select(Analysis).where(Analysis.user_id == user_id).order_by(Analysis.created_at.desc())
    )
    return result.scalars().all()


async def get_analysis(db: AsyncSession, analysis_id: str, user_id: str) -> Analysis | None:
    result = await db.execute(
        select(Analysis).where(Analysis.id == analysis_id, Analysis.user_id == user_id)
    )
    return result.scalar_one_or_none()
