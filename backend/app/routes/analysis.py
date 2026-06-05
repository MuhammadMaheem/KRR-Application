from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.analysis import AnalysisCreate, AnalysisResponse
from app.services import analysis_service

router = APIRouter(prefix="/api/analyses", tags=["analyses"])

VALID_TYPES = {"comparative", "synthetic_review"}


@router.get("", response_model=list[AnalysisResponse])
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await analysis_service.get_all_analyses(db, str(current_user.id))


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    body: AnalysisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of {VALID_TYPES}")
    if len(body.paper_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 paper_ids")

    try:
        analysis = await analysis_service.create_analysis(
            db,
            body.type,
            [str(pid) for pid in body.paper_ids],
            str(current_user.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return analysis


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = await analysis_service.get_analysis(db, analysis_id, str(current_user.id))
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis
