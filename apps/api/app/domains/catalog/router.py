import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Path, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_store_role
from app.core.errors import BadRequestError, NotFoundError
from app.db.session import get_db_session
from app.domains.auth.models import User
from app.domains.catalog.schemas import (
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    ProductCreate,
    ProductDetail,
    ProductImageCreate,
    ProductImageRead,
    ProductListItem,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantRead,
)
from app.domains.catalog.service import CatalogService
from app.domains.tenants.service import TenantService
from app.storage.local import LocalStorageProvider
from app.tenants.context import get_tenant_context

router = APIRouter(prefix="/catalog", tags=["Catalog"])
admin_router = APIRouter(prefix="/admin/stores/{storeSlug}/catalog", tags=["Store Admin Catalog"])
storage_router = APIRouter(prefix="/admin/stores/{storeSlug}/storage", tags=["Store Admin Storage"])
storage_provider = LocalStorageProvider()


async def get_target_tenant_id(
    store_slug: Optional[str] = None,
    session: AsyncSession = Depends(get_db_session),
) -> uuid.UUID:
    """Resolve tenant ID from route slug or request context."""
    if store_slug:
        tenant = await TenantService.get_by_slug(session, store_slug)
        if not tenant:
            raise NotFoundError(detail=f"Store '{store_slug}' not found.")
        return tenant.id

    ctx = get_tenant_context()
    if ctx and ctx.tenant_id:
        return ctx.tenant_id

    raise BadRequestError(detail="Store context is required (either via Host domain, X-Tenant-Slug, or store_slug parameter).")


# =================================================================
# 1. PUBLIC STOREFRONT ENDPOINTS
# =================================================================

@router.get("/categories", response_model=List[CategoryRead])
async def list_storefront_categories(
    store_slug: Optional[str] = Query(None, alias="storeSlug"),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(store_slug, session)
    return await CatalogService.list_categories(session, tenant_id, active_only=True)


@router.get("/products", response_model=List[ProductListItem])
async def list_storefront_products(
    store_slug: Optional[str] = Query(None, alias="storeSlug"),
    category_id: Optional[uuid.UUID] = Query(None, alias="categoryId"),
    category_slug: Optional[str] = Query(None, alias="categorySlug"),
    is_featured: Optional[bool] = Query(None, alias="isFeatured"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(store_slug, session)
    return await CatalogService.list_products(
        session=session,
        tenant_id=tenant_id,
        category_id=category_id,
        category_slug=category_slug,
        is_featured=is_featured,
        search=search,
        active_only=True,
        skip=skip,
        limit=limit,
    )


@router.get("/products/{slug}", response_model=ProductDetail)
async def get_storefront_product(
    slug: str,
    store_slug: Optional[str] = Query(None, alias="storeSlug"),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(store_slug, session)
    product = await CatalogService.get_product_by_slug(session, tenant_id, slug)
    if not product or not product.is_active:
        raise NotFoundError(detail=f"Product '{slug}' not found.")
    return product


# =================================================================
# 2. STORE ADMIN CATALOG ENDPOINTS
# =================================================================

@admin_router.get("/categories", response_model=List[CategoryRead])
async def admin_list_categories(
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    return await CatalogService.list_categories(session, tenant_id, active_only=False)


@admin_router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def admin_create_category(
    data: CategoryCreate,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    category = await CatalogService.create_category(session, tenant_id, data)
    await session.commit()
    return category


@admin_router.put("/categories/{categoryId}", response_model=CategoryRead)
async def admin_update_category(
    categoryId: uuid.UUID,
    data: CategoryUpdate,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    category = await CatalogService.update_category(session, tenant_id, categoryId, data)
    await session.commit()
    return category


@admin_router.delete("/categories/{categoryId}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_category(
    categoryId: uuid.UUID,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    await CatalogService.delete_category(session, tenant_id, categoryId)
    await session.commit()


@admin_router.get("/products", response_model=List[ProductListItem])
async def admin_list_products(
    storeSlug: str = Path(...),
    category_id: Optional[uuid.UUID] = Query(None, alias="categoryId"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    return await CatalogService.list_products(
        session=session,
        tenant_id=tenant_id,
        category_id=category_id,
        search=search,
        active_only=False,
        skip=skip,
        limit=limit,
    )


@admin_router.post("/products", response_model=ProductDetail, status_code=status.HTTP_201_CREATED)
async def admin_create_product(
    data: ProductCreate,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    product = await CatalogService.create_product(session, tenant_id, data)
    await session.commit()
    return product


@admin_router.get("/products/{productId}", response_model=ProductDetail)
async def admin_get_product(
    productId: uuid.UUID,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    product = await CatalogService.get_product_by_id(session, tenant_id, productId)
    if not product:
        raise NotFoundError(detail="Product not found.")
    return product


@admin_router.put("/products/{productId}", response_model=ProductDetail)
async def admin_update_product(
    productId: uuid.UUID,
    data: ProductUpdate,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    product = await CatalogService.update_product(session, tenant_id, productId, data)
    await session.commit()
    return product


@admin_router.delete("/products/{productId}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_product(
    productId: uuid.UUID,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    await CatalogService.delete_product(session, tenant_id, productId)
    await session.commit()


@admin_router.post("/products/{productId}/variants", response_model=ProductVariantRead, status_code=status.HTTP_201_CREATED)
async def admin_add_variant(
    productId: uuid.UUID,
    data: ProductVariantCreate,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    variant = await CatalogService.add_variant(session, tenant_id, productId, data)
    await session.commit()
    return variant


@admin_router.post("/products/{productId}/images", response_model=ProductImageRead, status_code=status.HTTP_201_CREATED)
async def admin_add_image(
    productId: uuid.UUID,
    data: ProductImageCreate,
    storeSlug: str = Path(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    tenant_id = await get_target_tenant_id(storeSlug, session)
    image = await CatalogService.add_image(session, tenant_id, productId, data)
    await session.commit()
    return image


# =================================================================
# 3. MEDIA UPLOAD ENDPOINT
# =================================================================

@storage_router.post("/upload")
async def upload_image(
    storeSlug: str = Path(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_store_role(["store_admin", "store_staff"])),
    session: AsyncSession = Depends(get_db_session),
):
    # Validate extension
    filename = file.filename or "uploaded.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise BadRequestError(detail="Only image files (jpg, png, webp, gif) are permitted.")

    unique_filename = f"{uuid.uuid4().hex[:12]}_{filename}"
    dest_path = f"{storeSlug}/{unique_filename}"

    url = await storage_provider.upload(
        file_obj=file.file,
        destination_path=dest_path,
        content_type=file.content_type,
    )
    return {"url": url, "filename": filename}
