import uuid
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Optional

from app.core.errors import BadRequestError


@dataclass(frozen=True)
class TenantContext:
    tenant_id: Optional[uuid.UUID] = None
    slug: Optional[str] = None
    domain: Optional[str] = None
    name: Optional[str] = None
    is_platform_admin: bool = False


_current_tenant_ctx: ContextVar[Optional[TenantContext]] = ContextVar(
    "current_tenant_ctx", default=None
)


def get_tenant_context() -> Optional[TenantContext]:
    return _current_tenant_ctx.get()


def set_tenant_context(ctx: Optional[TenantContext]):
    return _current_tenant_ctx.set(ctx)


def reset_tenant_context(token) -> None:
    _current_tenant_ctx.reset(token)


def require_tenant_context() -> TenantContext:
    ctx = get_tenant_context()
    if not ctx or not ctx.tenant_id:
        raise BadRequestError(detail="Operation requires an active tenant context.")
    return ctx
