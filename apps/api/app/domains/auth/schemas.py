import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MembershipRead(BaseModel):
    store_id: uuid.UUID = Field(..., alias="storeId")
    store_slug: str = Field(..., alias="storeSlug")
    store_name: Optional[str] = Field(None, alias="storeName")
    role: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserBase(BaseModel):
    email: str = Field(
        ...,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        description="User email address (supports standard, custom, and local dev TLDs)",
    )
    display_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        alias="displayName",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    store_slug: Optional[str] = Field(None, alias="storeSlug")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool = Field(..., alias="isActive")
    is_platform_admin: bool = Field(..., alias="isPlatformAdmin")
    memberships: List[MembershipRead] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    access_token: str = Field(..., alias="accessToken")
    expires_in_seconds: int = Field(..., alias="expiresInSeconds")
    user: UserRead

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class RegisterResponse(BaseModel):
    user: UserRead
    message: str = "User registered successfully"

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class InviteStoreAdminRequest(BaseModel):
    """Used by platform admin to invite a store admin user (creates user + store_admin membership)."""
    email: str = Field(
        ...,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    display_name: str = Field(..., min_length=2, max_length=255, alias="displayName")
    password: str = Field(..., min_length=8, max_length=128)
    store_slug: str = Field(..., alias="storeSlug")
    role: str = Field(default="store_admin", alias="role")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
