from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.record import Record, RecordType
from app.models.user import User


def _user_filter(user: User):
    if user.role.value != "admin":
        return Record.user_id == user.id
    return Record.is_deleted == False


async def get_summary(db: AsyncSession, user: User) -> dict:
    base = select(Record).where(_user_filter(user))
    result = await db.execute(base)
    records = result.scalars().all()

    total_income = sum(r.amount for r in records if r.record_type == RecordType.income)
    total_expense = sum(
        r.amount for r in records if r.record_type == RecordType.expense
    )
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net": total_income - total_expense,
        "record_count": len(records),
    }


async def get_by_category(db: AsyncSession, user: User) -> list[dict]:
    base = (
        select(
            Record.category,
            func.sum(Record.amount).label("total"),
            func.count(Record.id).label("count"),
        )
        .where(_user_filter(user))
        .group_by(Record.category)
        .order_by(func.sum(Record.amount).desc())
    )
    result = await db.execute(base)
    rows = result.all()
    return [{"category": r.category, "total": r.total, "count": r.count} for r in rows]


async def get_trends(db: AsyncSession, user: User, months: int = 6) -> list[dict]:
    cutoff = datetime.now() - timedelta(days=months * 30)
    base = (
        select(
            func.strftime("%Y-%m", Record.recorded_at).label("period"),
            Record.record_type,
            func.sum(Record.amount).label("total"),
        )
        .where(_user_filter(user), Record.recorded_at >= cutoff)
        .group_by("period", Record.record_type)
        .order_by("period")
    )
    result = await db.execute(base)
    rows = result.all()

    trends: dict[str, dict] = {}
    for r in rows:
        if r.period not in trends:
            trends[r.period] = {
                "period": r.period,
                "income": Decimal("0"),
                "expense": Decimal("0"),
            }
        if r.record_type == RecordType.income:
            trends[r.period]["income"] = r.total
        else:
            trends[r.period]["expense"] = r.total
    return list(trends.values())


async def get_recent(db: AsyncSession, user: User, limit: int = 10) -> list[Record]:
    base = (
        select(Record)
        .where(_user_filter(user))
        .order_by(Record.recorded_at.desc())
        .limit(limit)
    )
    result = await db.execute(base)
    return list(result.scalars().all())
