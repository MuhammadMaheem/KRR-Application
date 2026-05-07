from pydantic import BaseModel
from typing import List, Optional


# ── Request Models (used in main.py) ──────────────────────────────────

class CompareRequest(BaseModel):
    paper_ids: List[str]


class ReviewRequest(BaseModel):
    topic: str
    paper_ids: List[str]


# ── Response / Data Models ─────────────────────────────────────────────

class DeepAnalysis(BaseModel):
    key_contributions: str
    research_problem: str
    methodology: str
    results: str
    limitations: str
    gaps: List[str]
    keywords: List[str]


class Paper(BaseModel):
    id: str
    title: str
    authors: str
    year: str
    abstract_summary: str
    deep_analysis: DeepAnalysis
    gaps: List[str]


# ── User Model (for future DB-backed auth) ──────────────────────────

class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: str
    hashed_password: str
    is_active: bool = True
    role: str = "researcher"  # admin, researcher, viewer


# ── Token Models ──────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
