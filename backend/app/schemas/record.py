from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class RecordCreateRequest(BaseModel):
    record_type: str
    category: str = Field(..., min_length=1, max_length=100)
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    description: str | None = Field(None, max_length=1000)
    recorded_at: datetime | None = None

    @field_validator("record_type")
    @classmethod
    def validate_record_type(cls, v: str) -> str:
        if v not in ("income", "expense"):
            raise ValueError("record_type must be income or expense")
        return v


class RecordUpdateRequest(BaseModel):
    record_type: str | None = None
    category: str | None = Field(None, min_length=1, max_length=100)
    amount: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    description: str | None = Field(None, max_length=1000)
    recorded_at: datetime | None = None

    @field_validator("record_type")
    @classmethod
    def validate_record_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("income", "expense"):
            raise ValueError("record_type must be income or expense")
        return v


class RecordResponse(BaseModel):
    id: str
    user_id: str
    record_type: str
    category: str
    amount: Decimal
    description: str | None
    recorded_at: datetime
    is_deleted: bool

    model_config = {"from_attributes": True}


class RecordListResponse(BaseModel):
    items: list[RecordResponse]
    total: int
    page: int
    page_size: int
