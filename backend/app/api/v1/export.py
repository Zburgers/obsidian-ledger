from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

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


@router.get("/pdf")
async def export_pdf(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pdf_bytes = await export_service.get_records_pdf_bytes(db, current_user)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=records.pdf"},
    )
