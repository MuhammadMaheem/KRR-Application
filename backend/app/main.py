import uuid
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from app.api.auth import router as auth_router, get_current_user
from app.services import pdf_service
from app.services.ai_service import analyze_paper, compare_papers, generate_literature_review
from app.db.session import get_db, engine
from app.db.base import Base
from app.models.paper import Paper as PaperModel
from app.models.user import User
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.core.logging import log


app = FastAPI(title="KRR — AI Literature Review System", version=settings.VERSION)


# ── Startup event: create tables + default admin ──────────────────

@app.on_event("startup")
async def startup():
    try:
        Base.metadata.create_all(bind=engine)
        log.info("database_tables_created")

        # Auto-create default admin if no users exist
        import uuid
        from app.core.security import get_password_hash
        from sqlalchemy.orm import sessionmaker
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                default_admin = User(
                    id=str(uuid.uuid4()),
                    email="admin@krr.com",
                    hashed_password=get_password_hash("admin123"),
                    role="admin",
                    is_active=True,
                )
                db.add(default_admin)
                db.commit()
                log.info("default_admin_created", email="admin@krr.com")
                print("✅ Default admin created: admin@krr.com / admin123")
        finally:
            db.close()
    except Exception as e:
        log.warning("startup_error", error=str(e))


# ── Request logging middleware ───────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    log.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration,
    )
    return response


# ── CORS ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Rate limiting ────────────────────────────────────────────────

app.state.limiter = limiter
app.add_exception_handler(429, rate_limit_exceeded_handler)


# ── Routers ────────────────────────────────────────────────────

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])


# ── Pydantic request models ──────────────────────────────────────────

class CompareRequest(BaseModel):
    paper_ids: List[str]


class ReviewRequest(BaseModel):
    topic: str
    paper_ids: List[str]


class SearchRequest(BaseModel):
    query: Optional[str] = None
    year: Optional[str] = None
    page: int = 1
    page_size: int = 20


# ── Helpers ────────────────────────────────────────────────────

def _extract_year(metadata: dict) -> str:
    raw = metadata.get("creationDate", "") or metadata.get("modDate", "")
    if raw.startswith("D:") and len(raw) >= 6:
        try:
            return raw[2:6]
        except Exception:
            pass
    return str(datetime.now().year)


# ── Endpoints ──────────────────────────────────────────────────

@app.get("/api/library")
@limiter.limit("30/minute")
async def get_library(
    request: Request,
    db: Session = Depends(get_db),
    _user: str = Depends(get_current_user),
):
    papers = db.query(PaperModel).filter(PaperModel.deleted_at.is_(None)).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "year": p.year,
            "abstract_summary": p.abstract_summary,
            "deep_analysis": p.deep_analysis,
            "gaps": p.gaps or [],
        }
        for p in papers
    ]


@app.post("/api/upload")
@limiter.limit("10/minute")
async def upload_paper(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_data = await pdf_service.process_pdf(file)
    analysis_result = await analyze_paper(pdf_data["text"])

    paper_id = str(uuid.uuid4())
    metadata = pdf_data.get("metadata", {})

    paper = PaperModel(
        id=paper_id,
        title=metadata.get("title") or file.filename.replace(".pdf", "") or "Unknown Title",
        authors=metadata.get("author") or "Unknown Author",
        year=_extract_year(metadata),
        abstract_summary=pdf_data["text"][:1000] + "…",
        deep_analysis=analysis_result,
        gaps=analysis_result.get("gaps", []),
        file_name=file.filename,
    )

    db.add(paper)
    db.commit()
    db.refresh(paper)

    print(f"✅ Paper stored: {paper_id} — '{paper.title}'")
    return {
        "status": "success",
        "data": {
            "id": paper.id,
            "title": paper.title,
            "authors": paper.authors,
            "year": paper.year,
            "abstract_summary": paper.abstract_summary,
            "deep_analysis": paper.deep_analysis,
            "gaps": paper.gaps,
        },
    }


@app.post("/api/compare")
@limiter.limit("20/minute")
async def api_compare_papers(
    request: Request,
    req: CompareRequest,
    db: Session = Depends(get_db),
    _user: str = Depends(get_current_user),
):
    valid_papers = (
        db.query(PaperModel)
        .filter(PaperModel.id.in_(req.paper_ids), PaperModel.deleted_at.is_(None))
        .all()
    )

    if len(valid_papers) < 2:
        raise HTTPException(status_code=400, detail="At least 2 valid paper IDs are required.")

    def _paper_context(p: PaperModel) -> str:
        da = p.deep_analysis or {}
        return (
            f"Title: {p.title}\n"
            f"Research Problem: {da.get('research_problem', 'N/A')}\n"
            f"Methodology: {str(da.get('methodology', 'N/A'))[:500]}\n"
            f"Results: {str(da.get('results', 'N/A'))[:500]}\n"
            f"Limitations: {str(da.get('limitations', 'N/A'))[:300]}"
        )

    text1 = _paper_context(valid_papers[0])
    text2 = _paper_context(valid_papers[1])

    result = await compare_papers(text1, text2)
    return {"status": "success", "data": result}


@app.post("/api/generate-review")
@limiter.limit("10/minute")
async def api_generate_review(
    request: Request,
    req: ReviewRequest,
    db: Session = Depends(get_db),
    _user: str = Depends(get_current_user),
):
    if not req.topic or not req.topic.strip():
        raise HTTPException(status_code=400, detail="A topic is required.")

    papers = (
        db.query(PaperModel)
        .filter(PaperModel.id.in_(req.paper_ids), PaperModel.deleted_at.is_(None))
        .all()
    )

    if not papers:
        raise HTTPException(status_code=400, detail="No valid papers found for the given IDs.")

    review = await generate_literature_review(req.topic, papers)
    return {
        "status": "success",
        "data": {
            "topic": req.topic,
            "papers_analyzed": len(papers),
            "review_content": review,
        },
    }


# ── NEW: Search with pagination ──────────────────────────────────

@app.post("/api/search")
@limiter.limit("30/minute")
async def search_papers(
    request: Request,
    req: SearchRequest,
    db: Session = Depends(get_db),
    _user: str = Depends(get_current_user),
):
    query = db.query(PaperModel).filter(PaperModel.deleted_at.is_(None))

    if req.query:
        search = f"%{req.query}%"
        query = query.filter(
            (PaperModel.title.ilike(search)) | (PaperModel.authors.ilike(search))
        )

    if req.year:
        query = query.filter(PaperModel.year == req.year)

    total = query.count()
    papers = (
        query.order_by(PaperModel.created_at.desc())
        .offset((req.page - 1) * req.page_size)
        .limit(req.page_size)
        .all()
    )

    return {
        "total": total,
        "page": req.page,
        "page_size": req.page_size,
        "papers": [
            {
                "id": p.id,
                "title": p.title,
                "authors": p.authors,
                "year": p.year,
                "abstract_summary": p.abstract_summary,
                "gaps": p.gaps or [],
            }
            for p in papers
        ],
    }


# ── NEW: Delete paper (soft delete) ──────────────────────────────

@app.delete("/api/papers/{paper_id}")
@limiter.limit("10/minute")
async def delete_paper(
    request: Request,
    paper_id: str,
    db: Session = Depends(get_db),
    _user: str = Depends(get_current_user),
):
    paper = (
        db.query(PaperModel)
        .filter(PaperModel.id == paper_id, PaperModel.deleted_at.is_(None))
        .first()
    )
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    from datetime import datetime
    paper.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Paper deleted"}


# ── Health Check ────────────────────────────────────────────────

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    return {"status": "healthy", "version": settings.VERSION, "database": db_status}


# ── Metrics (Prometheus) ────────────────────────────────────────

try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from fastapi.responses import Response

    @app.get("/metrics")
    async def metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
except ImportError:
    pass  # Prometheus not installed


# ── Dev entry point ──────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
