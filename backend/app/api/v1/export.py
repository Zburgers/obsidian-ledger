from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services import export_service

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/csv")
async def export_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    csv_content = await export_service.get_records_csv(db, current_user)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=records.csv"},
    )


@router.get("/txt")
async def export_txt(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    txt_bytes = await export_service.get_records_text(db, current_user)
    return Response(
        content=txt_bytes,
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=records.txt"},
    )
