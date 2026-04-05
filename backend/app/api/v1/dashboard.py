from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_analyst_or_admin
from app.models.user import User
from app.schemas.dashboard import (
    SummaryResponse,
    CategoryResponse,
    TrendsResponse,
    ComparisonResponse,
    RecentResponse,
    RecordBrief,
)
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=SummaryResponse)
async def summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await dashboard_service.get_summary(db, current_user)
    return SummaryResponse(**data)


@router.get("/by-category", response_model=CategoryResponse)
async def by_category(
    current_user: User = Depends(require_analyst_or_admin),
    db: AsyncSession = Depends(get_db),
):
    items = await dashboard_service.get_by_category(db, current_user)
    return CategoryResponse(items=items)


@router.get("/trends", response_model=TrendsResponse)
async def trends(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(require_analyst_or_admin),
    db: AsyncSession = Depends(get_db),
):
    items = await dashboard_service.get_trends(db, current_user, months)
    return TrendsResponse(items=items)


@router.get("/comparison", response_model=ComparisonResponse)
async def comparison(
    period_a: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    period_b: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(require_analyst_or_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await dashboard_service.get_monthly_comparison(
        db, current_user, period_a, period_b
    )
    return ComparisonResponse(**data)


@router.get("/recent", response_model=RecentResponse)
async def recent(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    records = await dashboard_service.get_recent(db, current_user, limit)
    return RecentResponse(
        items=[
            RecordBrief(
                id=str(r.id),
                record_type=r.record_type.value,
                category=r.category,
                amount=r.amount,
                description=r.description,
                recorded_at=r.recorded_at.isoformat(),
            )
            for r in records
        ]
    )
