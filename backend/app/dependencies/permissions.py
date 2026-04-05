from fastapi import Depends, HTTPException, status

from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def ensure_analyst_or_admin(current_user: User) -> None:
    if current_user.role not in {UserRole.analyst, UserRole.admin}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst access required",
        )


async def require_analyst_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    ensure_analyst_or_admin(current_user)
    return current_user
