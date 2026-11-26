from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.tenants.models import Tenant
from app.domains.tenants.service import TenantService


class TenantResolver:
    @staticmethod
    async def resolve_from_host(session: AsyncSession, host_header: str) -> Optional[Tenant]:
        """
        Resolves tenant by matching hostname against registered domain, or parsing
        store subdomain (e.g. 'store1.commerce.local' or 'store1.localhost').
        """
        if not host_header:
            return None

        clean_host = host_header.split(":")[0].lower().strip()

        # 1. Direct domain match
        tenant = await TenantService.get_by_domain(session, clean_host)
        if tenant and tenant.is_active:
            return tenant

        # 2. Subdomain extraction (e.g. store1.domain.com)
        parts = clean_host.split(".")
        if len(parts) >= 2 and parts[0] not in ("www", "api", "platform", "localhost", "127"):
            potential_slug = parts[0]
            tenant = await TenantService.get_by_slug(session, potential_slug)
            if tenant and tenant.is_active:
                return tenant

        return None

    @staticmethod
    async def resolve_from_slug(session: AsyncSession, slug: str) -> Optional[Tenant]:
        tenant = await TenantService.get_by_slug(session, slug.lower().strip())
        if tenant and tenant.is_active:
            return tenant
        return None
