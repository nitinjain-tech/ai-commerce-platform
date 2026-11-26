import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.domains.tenants.models import Tenant
from app.domains.tenants.schemas import TenantCreate, TenantUpdate


class TenantService:
    @staticmethod
    async def get_by_id(session: AsyncSession, tenant_id: uuid.UUID) -> Optional[Tenant]:
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_slug(session: AsyncSession, slug: str) -> Optional[Tenant]:
        stmt = select(Tenant).where(Tenant.slug == slug)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_domain(session: AsyncSession, domain: str) -> Optional[Tenant]:
        stmt = select(Tenant).where(Tenant.domain == domain)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_all(
        session: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[Tenant]:
        stmt = select(Tenant).offset(skip).limit(limit).order_by(Tenant.name)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_tenant(session: AsyncSession, data: TenantCreate) -> Tenant:
        existing_slug = await TenantService.get_by_slug(session, data.slug)
        if existing_slug:
            raise ConflictError(detail=f"Store with slug '{data.slug}' already exists.")

        if data.domain:
            existing_domain = await TenantService.get_by_domain(session, data.domain)
            if existing_domain:
                raise ConflictError(detail=f"Domain '{data.domain}' is already assigned.")

        tenant = Tenant(
            slug=data.slug,
            name=data.name,
            domain=data.domain,
            is_active=True,
        )
        session.add(tenant)
        await session.flush()
        return tenant

    @staticmethod
    async def update_tenant(
        session: AsyncSession, tenant_id: uuid.UUID, data: TenantUpdate
    ) -> Tenant:
        tenant = await TenantService.get_by_id(session, tenant_id)
        if not tenant:
            raise NotFoundError(detail="Tenant not found.")

        if data.name is not None:
            tenant.name = data.name
        if data.domain is not None:
            if data.domain != tenant.domain:
                existing_domain = await TenantService.get_by_domain(session, data.domain)
                if existing_domain:
                    raise ConflictError(detail=f"Domain '{data.domain}' is already assigned.")
            tenant.domain = data.domain
        if data.is_active is not None:
            tenant.is_active = data.is_active

        await session.flush()
        return tenant
