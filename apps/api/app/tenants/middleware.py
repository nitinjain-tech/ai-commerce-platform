from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.db.session import async_session_maker
from app.tenants.context import TenantContext, reset_tenant_context, set_tenant_context
from app.tenants.resolver import TenantResolver

settings = get_settings()


class TenantResolutionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip tenant resolution for system/documentation routes
        if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
            request.state.tenant = TenantContext()
            return await call_next(request)

        host = request.headers.get("host", "")
        slug_override = request.headers.get("x-tenant-slug")
        domain_override = request.headers.get("x-tenant-domain")

        tenant = None
        try:
            async with async_session_maker() as session:
                if slug_override:
                    tenant = await TenantResolver.resolve_from_slug(session, slug_override)
                elif domain_override:
                    tenant = await TenantResolver.resolve_from_host(session, domain_override)
                elif host:
                    tenant = await TenantResolver.resolve_from_host(session, host)
        except Exception:
            # Fall back gracefully if DB is unreachable or in non-DB contexts
            tenant = None

        if tenant:
            ctx = TenantContext(
                tenant_id=tenant.id,
                slug=tenant.slug,
                domain=tenant.domain,
                name=tenant.name,
                is_platform_admin=False,
            )
        else:
            ctx = TenantContext()

        token = set_tenant_context(ctx)
        # Attach tenant info to request state for convenient access in endpoints
        request.state.tenant = ctx
        try:
            response = await call_next(request)
            return response
        finally:
            reset_tenant_context(token)
