import uuid
import os
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, or_

from app.models.paper import Paper
from app.services import pdf_service, groq_service, embedding_service


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
                try:
                    embed_text = f"{paper.title}. {paper.abstract or ''} {summary or ''}"
                    paper.embedding = embedding_service.embed(embed_text)
                except Exception:
                    pass  # embeddings optional — skip if model unavailable

            paper.status = "processed"
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            paper.status = "error"
            paper.error_message = str(e)
            paper.updated_at = datetime.now(timezone.utc)
            await db.commit()


async def get_all_papers(
    db: AsyncSession,
    user_id: str,
    page: int = 1,
    limit: int = 20,
    q: str | None = None,
) -> dict:
    base_filter = Paper.user_id == user_id
    if q:
        search = f"%{q}%"
        base_filter = base_filter & or_(
            Paper.title.ilike(search),
            Paper.abstract.ilike(search),
        )

    total_result = await db.execute(select(func.count()).select_from(Paper).where(base_filter))
    total = total_result.scalar_one()

    offset = (page - 1) * limit
    result = await db.execute(
        select(Paper)
        .where(base_filter)
        .order_by(Paper.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, -(-total // limit)),
    }


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
