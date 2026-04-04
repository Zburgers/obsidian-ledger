import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.record import Record, RecordType
from app.models.user import User
from app.schemas.record import RecordCreateRequest, RecordUpdateRequest


async def list_records(
    db: AsyncSession,
    user: User,
    page: int = 1,
    page_size: int = 20,
    record_type: str | None = None,
    category: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    search: str | None = None,
) -> dict:
    base = select(Record).where(Record.is_deleted == False)

    if user.role.value != "admin":
        base = base.where(Record.user_id == user.id)

    if record_type:
        base = base.where(Record.record_type == record_type)
    if category:
        safe = category.replace("%", r"\%").replace("_", r"\_")
        base = base.where(Record.category.ilike(f"%{safe}%", escape="\\"))
    if date_from:
        base = base.where(Record.recorded_at >= date_from)
    if date_to:
        base = base.where(Record.recorded_at <= date_to)
    if search:
        safe = search.replace("%", r"\%").replace("_", r"\_")
        base = base.where(Record.description.ilike(f"%{safe}%", escape="\\"))

    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        base.order_by(Record.recorded_at.desc()).offset(offset).limit(page_size)
    )
    items = result.scalars().all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def create_record(
    db: AsyncSession, user: User, payload: RecordCreateRequest
) -> Record:
    record = Record(
        user_id=user.id,
        record_type=RecordType(payload.record_type),
        category=payload.category,
        amount=payload.amount,
        description=payload.description,
        recorded_at=payload.recorded_at or datetime.now(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_record(db: AsyncSession, user: User, record_id: str) -> Record:
    try:
        rid = uuid.UUID(record_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid record ID"
        )

    base = select(Record).where(Record.id == rid, Record.is_deleted == False)
    if user.role.value != "admin":
        base = base.where(Record.user_id == user.id)

    result = await db.execute(base)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Record not found"
        )
    return record


async def update_record(
    db: AsyncSession, user: User, record_id: str, payload: RecordUpdateRequest
) -> Record:
    record = await get_record(db, user, record_id)

    if payload.record_type is not None:
        record.record_type = RecordType(payload.record_type)
    if payload.category is not None:
        record.category = payload.category
    if payload.amount is not None:
        record.amount = payload.amount
    if payload.description is not None:
        record.description = payload.description
    if payload.recorded_at is not None:
        record.recorded_at = payload.recorded_at

    await db.commit()
    await db.refresh(record)
    return record


async def delete_record(db: AsyncSession, user: User, record_id: str) -> None:
    record = await get_record(db, user, record_id)
    record.is_deleted = True
    await db.commit()
