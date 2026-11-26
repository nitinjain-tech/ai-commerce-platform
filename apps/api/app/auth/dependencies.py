from typing import Callable, List, Optional

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_access_token
from app.core.errors import ForbiddenError, UnauthorizedError
from app.db.session import get_db_session
from app.domains.auth.models import User
from app.domains.auth.service import AuthService
from app.tenants.context import get_tenant_context

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    if not auth or not auth.credentials:
        raise UnauthorizedError(detail="Missing authorization header.")

    payload = decode_access_token(auth.credentials)
    user = await AuthService.get_user_by_id(session, payload.sub)
    if not user:
        raise UnauthorizedError(detail="User no longer exists.")

    if not user.is_active:
        raise UnauthorizedError(detail="User account is inactive.")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise UnauthorizedError(detail="User account is inactive.")
    return current_user


async def require_platform_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_platform_admin:
        raise ForbiddenError(detail="Platform administrator privileges required.")
    return current_user


def require_store_role(allowed_roles: List[str]) -> Callable:
    """
    Factory dependency checking that the user is either:
    1. A platform admin, or
    2. Holds one of allowed_roles on the store (identified by route store_slug or request tenant context).
    """
    async def dependency(
        request: Request,
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.is_platform_admin:
            return current_user

        # Determine target store slug
        target_slug = (
            request.path_params.get("storeSlug")
            or request.path_params.get("store_slug")
        )
        if not target_slug:
            ctx = get_tenant_context()
            if ctx and ctx.slug:
                target_slug = ctx.slug

        if not target_slug:
            raise ForbiddenError(detail="Store context could not be determined.")

        # Check user's memberships
        for m in current_user.memberships:
            if (
                m.is_active
                and m.tenant
                and m.tenant.slug == target_slug
                and m.role in allowed_roles
            ):
                return current_user

        raise ForbiddenError(
            detail=f"Required role in ({', '.join(allowed_roles)}) for store '{target_slug}'."
        )

    return dependency
