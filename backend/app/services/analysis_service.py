from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.paper import Paper
from app.models.analysis import Analysis
from app.services import groq_service


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
