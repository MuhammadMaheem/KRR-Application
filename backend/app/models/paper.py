from sqlalchemy import Column, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
import uuid


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    authors = Column(String, nullable=True)
    year = Column(String, nullable=True)
    abstract_summary = Column(Text, nullable=True)
    deep_analysis = Column(JSON, nullable=True)
    gaps = Column(JSON, nullable=True)
    file_path = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete
