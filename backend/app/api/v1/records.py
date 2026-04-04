from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_admin
from app.models.user import User
from app.schemas.record import (
    RecordCreateRequest,
    RecordUpdateRequest,
    RecordResponse,
    RecordListResponse,
)
from app.services import record_service

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=RecordListResponse)
async def list_records_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: str | None = Query(None),
    category: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime

    df = datetime.fromisoformat(date_from) if date_from else None
    dt = datetime.fromisoformat(date_to) if date_to else None
    result = await record_service.list_records(
        db, current_user, page, page_size, type, category, df, dt, search
    )
    return RecordListResponse(
        items=[
            RecordResponse(
                id=str(r.id),
                user_id=str(r.user_id),
                record_type=r.record_type.value,
                category=r.category,
                amount=r.amount,
                description=r.description,
                recorded_at=r.recorded_at,
                is_deleted=r.is_deleted,
            )
            for r in result["items"]
        ],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
    )


@router.post("", status_code=201, response_model=RecordResponse)
async def create_record_endpoint(
    payload: RecordCreateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    record = await record_service.create_record(db, _admin, payload)
    return RecordResponse(
        id=str(record.id),
        user_id=str(record.user_id),
        record_type=record.record_type.value,
        category=record.category,
        amount=record.amount,
        description=record.description,
        recorded_at=record.recorded_at,
        is_deleted=record.is_deleted,
    )


@router.get("/{record_id}", response_model=RecordResponse)
async def get_record_endpoint(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await record_service.get_record(db, current_user, record_id)
    return RecordResponse(
        id=str(record.id),
        user_id=str(record.user_id),
        record_type=record.record_type.value,
        category=record.category,
        amount=record.amount,
        description=record.description,
        recorded_at=record.recorded_at,
        is_deleted=record.is_deleted,
    )


@router.patch("/{record_id}", response_model=RecordResponse)
async def update_record_endpoint(
    record_id: str,
    payload: RecordUpdateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    record = await record_service.update_record(db, _admin, record_id, payload)
    return RecordResponse(
        id=str(record.id),
        user_id=str(record.user_id),
        record_type=record.record_type.value,
        category=record.category,
        amount=record.amount,
        description=record.description,
        recorded_at=record.recorded_at,
        is_deleted=record.is_deleted,
    )


@router.delete("/{record_id}", status_code=204)
async def delete_record_endpoint(
    record_id: str,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await record_service.delete_record(db, _admin, record_id)
