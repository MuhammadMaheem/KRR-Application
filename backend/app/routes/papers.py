from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.paper import User
from app.schemas.paper import PaperResponse, PaperListResponse
from app.services import paper_service

router = APIRouter(prefix="/api/papers", tags=["papers"])

ALLOWED_TYPES = {"application/pdf", "application/x-pdf"}


@router.get("", response_model=list[PaperListResponse])
async def list_papers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await paper_service.get_all_papers(db, str(current_user.id))


@router.post("/upload", response_model=PaperResponse, status_code=status.HTTP_201_CREATED)
async def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    saved_path, saved_name = await paper_service.save_paper_file(file_bytes, file.filename)
    paper = await paper_service.create_paper(db, saved_path, file.filename, str(current_user.id))

    background_tasks.add_task(paper_service.process_paper, str(paper.id), saved_path)

    return paper


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await paper_service.delete_paper(db, paper_id, str(current_user.id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Paper not found")


@router.post("/{paper_id}/summarize", response_model=PaperResponse)
async def summarize_paper(
    paper_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if not paper.content:
        raise HTTPException(status_code=400, detail="Paper has no extracted content")

    background_tasks.add_task(paper_service.retrigger_summary, paper_id)
    return paper
