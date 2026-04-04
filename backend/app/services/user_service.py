import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.core.security import hash_password
from app.schemas.user import UserCreateRequest, UserUpdateRequest


async def list_users(db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    offset = (page - 1) * page_size
    count_result = await db.execute(
        select(func.count(User.id)).where(User.is_deleted == False)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(User)
        .where(User.is_deleted == False)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    users = result.scalars().all()
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def create_user(db: AsyncSession, payload: UserCreateRequest) -> User:
    existing = await db.execute(
        select(User).where(User.email == payload.email, User.is_deleted == False)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    role = UserRole(payload.role)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(
    db: AsyncSession, user_id: str, payload: UserUpdateRequest, current_admin: User
) -> User:
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
        )

    result = await db.execute(
        select(User).where(User.id == user_uuid, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Admin safety: prevent demoting the last active non-deleted admin
    if payload.role is not None and user.role == UserRole.admin:
        new_role = UserRole(payload.role)
        if new_role != UserRole.admin:
            # Count active non-deleted admins
            admin_count_result = await db.execute(
                select(func.count(User.id)).where(
                    User.role == UserRole.admin,
                    User.is_active == True,
                    User.is_deleted == False,
                )
            )
            admin_count = admin_count_result.scalar_one()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the last active admin",
                )

    # Admin safety: prevent changing your own role
    if payload.role is not None and user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    # Admin safety: prevent deactivating your own account
    if payload.is_active is False and user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    if payload.name is not None:
        user.name = payload.name
    if payload.role is not None:
        user.role = UserRole(payload.role)
    if payload.is_active is not None:
        user.is_active = payload.is_active

    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: str, current_admin: User) -> None:
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
        )

    result = await db.execute(
        select(User).where(User.id == user_uuid, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Admin safety: prevent deleting the last active non-deleted admin
    if user.role == UserRole.admin:
        admin_count_result = await db.execute(
            select(func.count(User.id)).where(
                User.role == UserRole.admin,
                User.is_active == True,
                User.is_deleted == False,
            )
        )
        admin_count = admin_count_result.scalar_one()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last active admin",
            )

    # Admin safety: prevent deleting your own account
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    user.is_deleted = True
    await db.commit()
