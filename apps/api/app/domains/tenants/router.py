from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_platform_admin
from app.core.errors import NotFoundError
from app.db.session import get_db_session
from app.domains.auth.models import User
from app.domains.tenants.schemas import TenantCreate, TenantPublicInfo, TenantRead
from app.domains.tenants.service import TenantService
from app.tenants.context import get_tenant_context

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get("/current", response_model=TenantPublicInfo)
async def get_current_tenant_info(
    session: AsyncSession = Depends(get_db_session),
):
    ctx = get_tenant_context()
    if not ctx or not ctx.tenant_id:
        raise NotFoundError(detail="No store context resolved for this host.")

    tenant = await TenantService.get_by_id(session, ctx.tenant_id)
    if not tenant:
        raise NotFoundError(detail="Store not found.")

    return tenant


@router.get("/{slug}", response_model=TenantPublicInfo)
async def get_tenant_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_db_session),
):
    tenant = await TenantService.get_by_slug(session, slug)
    if not tenant or not tenant.is_active:
        raise NotFoundError(detail=f"Store '{slug}' not found.")

    return tenant


@router.get("", response_model=List[TenantRead])
async def list_tenants(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_platform_admin),
    session: AsyncSession = Depends(get_db_session),
):
    return await TenantService.list_all(session, skip=skip, limit=limit)


@router.post("", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: TenantCreate,
    current_user: User = Depends(require_platform_admin),
    session: AsyncSession = Depends(get_db_session),
):
    tenant = await TenantService.create_tenant(session, data)
    await session.commit()
    return tenant
