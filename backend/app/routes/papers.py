import os
import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Query
from fastapi.responses import FileResponse, PlainTextResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from pydantic import BaseModel
from app.schemas.paper import PaperResponse, PaperListResponse, PaginatedPapers
from app.services import paper_service, groq_service

router = APIRouter(prefix="/api/papers", tags=["papers"])

ALLOWED_TYPES = {"application/pdf", "application/x-pdf"}


@router.get("", response_model=PaginatedPapers)
async def list_papers(
    page: int = 1,
    limit: int = 20,
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    limit = min(limit, 100)
    return await paper_service.get_all_papers(db, str(current_user.id), page=page, limit=limit, q=q)


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


@router.get("/{paper_id}/file")
async def serve_paper_file(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if not paper.file_path or not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    return FileResponse(
        paper.file_path,
        media_type="application/pdf",
        filename=paper.file_name,
    )


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


@router.get("/{paper_id}/cite")
async def cite_paper(
    paper_id: str,
    format: str = Query("bibtex", pattern="^(bibtex|apa|mla)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    authors = paper.authors or []
    year = paper.created_at.year if paper.created_at else datetime.now().year
    title = paper.title or "Untitled"
    key = (authors[0].split()[-1] if authors else "unknown").lower() + str(year)

    if format == "bibtex":
        author_str = " and ".join(authors) if authors else "Unknown"
        citation = (
            f"@article{{{key},\n"
            f"  title   = {{{title}}},\n"
            f"  author  = {{{author_str}}},\n"
            f"  year    = {{{year}}}\n"
            f"}}"
        )
        return PlainTextResponse(citation, media_type="text/plain")

    if format == "apa":
        last_names = ", ".join(a.split()[-1] + ", " + " ".join(a.split()[:-1]) for a in authors) if authors else "Unknown"
        citation = f"{last_names} ({year}). {title}."
        return PlainTextResponse(citation, media_type="text/plain")

    # mla
    mla_authors = ", ".join(authors) if authors else "Unknown"
    citation = f'{mla_authors}. "{title}." {year}.'
    return PlainTextResponse(citation, media_type="text/plain")


@router.get("/{paper_id}/stream")
async def stream_paper_status(
    paper_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SSE endpoint — streams paper status until terminal state (processed/error)."""
    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    async def event_generator():
        terminal = {"processed", "error"}
        poll_interval = 1.5
        max_polls = 120  # 3 min max

        for _ in range(max_polls):
            fresh = await paper_service.get_paper(db, paper_id, str(current_user.id))
            if not fresh:
                break
            payload = json.dumps({
                "status": fresh.status,
                "title": fresh.title,
                "summary": fresh.summary,
                "error_message": fresh.error_message,
            })
            yield f"data: {payload}\n\n"
            if fresh.status in terminal:
                break
            await asyncio.sleep(poll_interval)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    paper_id: str
    question: str


@router.post("/{paper_id}/chat", response_model=ChatResponse)
async def chat_with_paper(
    paper_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """RAG: answer a question grounded in a specific paper's content."""
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if not paper.content:
        raise HTTPException(status_code=400, detail="Paper has no extracted content yet")

    answer = groq_service.answer_question(
        title=paper.title,
        authors=paper.authors or [],
        context=paper.content,
        question=body.question,
    )
    return ChatResponse(answer=answer, paper_id=paper_id, question=body.question)


@router.post("/{paper_id}/chat/stream")
async def stream_chat(
    paper_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SSE: stream RAG answer token-by-token."""
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    paper = await paper_service.get_paper(db, paper_id, str(current_user.id))
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if not paper.content:
        raise HTTPException(status_code=400, detail="Paper has no extracted content yet")

    title = paper.title
    authors = paper.authors or []
    content = paper.content
    question = body.question

    async def generate():
        try:
            for chunk in groq_service.stream_answer(title, authors, content, question):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
