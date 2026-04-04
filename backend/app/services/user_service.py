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
    db: AsyncSession, user_id: str, payload: UserUpdateRequest
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

    if payload.name is not None:
        user.name = payload.name
    if payload.role is not None:
        user.role = UserRole(payload.role)
    if payload.is_active is not None:
        user.is_active = payload.is_active

    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: str) -> None:
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

    user.is_deleted = True
    await db.commit()
