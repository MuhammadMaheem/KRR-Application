from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class AnalysisCreate(BaseModel):
    type: str  # comparative | synthetic_review
    paper_ids: List[uuid.UUID]


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: str
    paper_ids: List[str]
    paper_titles: Optional[List[str]] = None
    result: str
    created_at: Optional[datetime] = None
