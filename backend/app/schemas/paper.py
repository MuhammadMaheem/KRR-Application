from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class PaperBase(BaseModel):
    title: str
    authors: List[str] = []
    abstract: Optional[str] = None


class PaperResponse(PaperBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    status: str
    summary: Optional[str] = None
    content: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PaperListResponse(PaperBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_name: str
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    status: str
    created_at: Optional[datetime] = None
