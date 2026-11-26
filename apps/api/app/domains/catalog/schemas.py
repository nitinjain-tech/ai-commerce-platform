import uuid
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# -------------------------------------------------------------
# Categories
# -------------------------------------------------------------
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, alias="imageUrl")
    parent_id: Optional[uuid.UUID] = Field(None, alias="parentId")
    is_active: bool = Field(True, alias="isActive")
    sort_order: int = Field(0, alias="sortOrder")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, alias="imageUrl")
    parent_id: Optional[uuid.UUID] = Field(None, alias="parentId")
    is_active: Optional[bool] = Field(None, alias="isActive")
    sort_order: Optional[int] = Field(None, alias="sortOrder")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CategoryRead(CategoryBase):
    id: uuid.UUID
    tenant_id: uuid.UUID = Field(..., alias="tenantId")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# -------------------------------------------------------------
# Product Variants
# -------------------------------------------------------------
class ProductVariantBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    price: Optional[Decimal] = None
    inventory_quantity: int = Field(0, alias="inventoryQuantity")
    is_active: bool = Field(True, alias="isActive")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=64)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[Decimal] = None
    inventory_quantity: Optional[int] = Field(None, alias="inventoryQuantity")
    is_active: Optional[bool] = Field(None, alias="isActive")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductVariantRead(ProductVariantBase):
    id: uuid.UUID
    product_id: uuid.UUID = Field(..., alias="productId")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# -------------------------------------------------------------
# Product Images
# -------------------------------------------------------------
class ProductImageBase(BaseModel):
    url: str = Field(..., max_length=500)
    alt_text: Optional[str] = Field(None, alias="altText")
    sort_order: int = Field(0, alias="sortOrder")
    is_thumbnail: bool = Field(False, alias="isThumbnail")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageRead(ProductImageBase):
    id: uuid.UUID
    product_id: uuid.UUID = Field(..., alias="productId")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# -------------------------------------------------------------
# Products
# -------------------------------------------------------------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=128, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    base_price: Decimal = Field(..., ge=0, alias="basePrice")
    compare_at_price: Optional[Decimal] = Field(None, ge=0, alias="compareAtPrice")
    currency: str = Field("USD", max_length=3)
    category_id: Optional[uuid.UUID] = Field(None, alias="categoryId")
    is_active: bool = Field(True, alias="isActive")
    is_featured: bool = Field(False, alias="isFeatured")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] = []
    images: List[ProductImageCreate] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=128, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, ge=0, alias="basePrice")
    compare_at_price: Optional[Decimal] = Field(None, ge=0, alias="compareAtPrice")
    currency: Optional[str] = Field(None, max_length=3)
    category_id: Optional[uuid.UUID] = Field(None, alias="categoryId")
    is_active: Optional[bool] = Field(None, alias="isActive")
    is_featured: Optional[bool] = Field(None, alias="isFeatured")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductListItem(ProductBase):
    id: uuid.UUID
    thumbnail_url: Optional[str] = Field(None, alias="thumbnailUrl")
    category_name: Optional[str] = Field(None, alias="categoryName")
    total_inventory: int = Field(0, alias="totalInventory")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductDetail(ProductBase):
    id: uuid.UUID
    category: Optional[CategoryRead] = None
    variants: List[ProductVariantRead] = []
    images: List[ProductImageRead] = []

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
