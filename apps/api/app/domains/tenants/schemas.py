import uuid
from typing import Optional

from pydantic import BaseModel, Field


class TenantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    currency: str = Field(default="USD", max_length=3)
    logo_url: Optional[str] = Field(None, max_length=500, alias="logoUrl")


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    currency: Optional[str] = Field(None, max_length=3)
    logo_url: Optional[str] = Field(None, max_length=500, alias="logoUrl")
    is_active: Optional[bool] = None


class TenantRead(TenantBase):
    id: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True, "populate_by_name": True}


class TenantPublicInfo(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    domain: Optional[str] = None
    description: Optional[str] = None
    currency: str = "USD"
    logo_url: Optional[str] = Field(None, alias="logoUrl")

    model_config = {"from_attributes": True, "populate_by_name": True}
