from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.schemas.paper import PaperListResponse
from app.services import embedding_service

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=list[PaperListResponse])
async def semantic_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vector similarity search over processed papers."""
    try:
        query_vec = embedding_service.embed(q)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Embedding model not available: {e}",
        )

    result = await db.execute(
        select(Paper)
        .where(Paper.user_id == current_user.id, Paper.embedding.isnot(None))
        .order_by(Paper.embedding.cosine_distance(query_vec))
        .limit(limit)
    )
    return result.scalars().all()
