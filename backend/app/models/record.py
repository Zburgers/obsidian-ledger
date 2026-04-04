import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String, Numeric, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

import uuid


class RecordType(str, enum.Enum):
    income = "income"
    expense = "expense"


class Record(Base):
    __tablename__ = "records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    record_type = Column(Enum(RecordType), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    recorded_at = Column(
        DateTime(timezone=True), nullable=False, default=func.now(), index=True
    )
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
