from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str | None = None
    role: str = "viewer"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("viewer", "analyst", "admin"):
            raise ValueError("Role must be viewer, analyst, or admin")
        return v


class UserUpdateRequest(BaseModel):
    name: str | None = None
    role: str | None = None
    is_active: bool | None = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None and v not in ("viewer", "analyst", "admin"):
            raise ValueError("Role must be viewer, analyst, or admin")
        return v


class UserListItem(BaseModel):
    id: str
    email: str
    name: str | None
    role: str
    is_active: bool
    is_deleted: bool

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserListItem]
    total: int
    page: int
    page_size: int
