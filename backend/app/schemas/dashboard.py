from decimal import Decimal

from pydantic import BaseModel


class SummaryResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net: Decimal
    record_count: int


class CategoryItem(BaseModel):
    category: str
    total: Decimal
    count: int


class CategoryResponse(BaseModel):
    items: list[CategoryItem]


class TrendItem(BaseModel):
    period: str
    income: Decimal
    expense: Decimal


class TrendsResponse(BaseModel):
    items: list[TrendItem]


class RecordBrief(BaseModel):
    id: str
    record_type: str
    category: str
    amount: Decimal
    description: str | None
    recorded_at: str


class RecentResponse(BaseModel):
    items: list[RecordBrief]
