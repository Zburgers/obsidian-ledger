from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_admin
from app.models.user import User
from app.schemas.user import (
    UserCreateRequest,
    UserUpdateRequest,
    UserListItem,
    UserListResponse,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def list_users_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await user_service.list_users(db, page, page_size)
    return UserListResponse(
        items=[
            UserListItem(
                id=str(u.id),
                email=u.email,
                name=u.name,
                role=u.role.value,
                is_active=u.is_active,
                is_deleted=u.is_deleted,
            )
            for u in result["items"]
        ],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
    )


@router.post("", status_code=201, response_model=UserListItem)
async def create_user_endpoint(
    payload: UserCreateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.create_user(db, payload)
    return UserListItem(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role.value,
        is_active=user.is_active,
        is_deleted=user.is_deleted,
    )


@router.patch("/{user_id}", response_model=UserListItem)
async def update_user_endpoint(
    user_id: str,
    payload: UserUpdateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.update_user(db, user_id, payload)
    return UserListItem(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role.value,
        is_active=user.is_active,
        is_deleted=user.is_deleted,
    )


@router.delete("/{user_id}", status_code=204)
async def delete_user_endpoint(
    user_id: str,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await user_service.delete_user(db, user_id)
