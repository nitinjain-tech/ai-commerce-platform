from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, require_platform_admin
from app.auth.jwt import create_access_token
from app.core.config import get_settings
from app.core.errors import UnauthorizedError
from app.db.session import get_db_session
from app.domains.auth.models import User
from app.domains.auth.schemas import (
    AuthResponse,
    InviteStoreAdminRequest,
    LoginRequest,
    RegisterResponse,
    UserCreate,
    UserRead,
)
from app.domains.auth.service import AuthService

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None,
        path="/api/v1/auth",
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    user = await AuthService.authenticate_user(
        session=session,
        email=credentials.email,
        password=credentials.password,
        ip_address=ip_address,
    )

    # Issue refresh token and set as httpOnly cookie
    refresh_token = await AuthService.create_refresh_token(
        session=session,
        user_id=user.id,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    set_refresh_cookie(response, refresh_token)

    # Format user DTO & memberships
    user_dto = AuthService.user_to_read_dto(user)
    memberships_claim = [
        {"store_id": str(m.store_id), "store_slug": m.store_slug, "role": m.role}
        for m in user_dto.memberships
    ]

    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        is_platform_admin=user.is_platform_admin,
        memberships=memberships_claim,
    )

    await session.commit()

    return AuthResponse(
        accessToken=access_token,
        expiresInSeconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_dto,
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token"),
    session: AsyncSession = Depends(get_db_session),
):
    if not refresh_token:
        raise UnauthorizedError(detail="Missing refresh token cookie.")

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    user, new_refresh_token = await AuthService.rotate_refresh_token(
        session=session,
        raw_token=refresh_token,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    set_refresh_cookie(response, new_refresh_token)

    user_dto = AuthService.user_to_read_dto(user)
    memberships_claim = [
        {"store_id": str(m.store_id), "store_slug": m.store_slug, "role": m.role}
        for m in user_dto.memberships
    ]

    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        is_platform_admin=user.is_platform_admin,
        memberships=memberships_claim,
    )

    await session.commit()

    return AuthResponse(
        accessToken=access_token,
        expiresInSeconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_dto,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token"),
    session: AsyncSession = Depends(get_db_session),
):
    if refresh_token:
        await AuthService.revoke_refresh_token(session, refresh_token)
        await session.commit()

    clear_refresh_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    ip_address = request.client.host if request.client else None
    user = await AuthService.register_user(
        session=session,
        data=data,
        ip_address=ip_address,
    )
    await session.commit()
    # Refresh to load relationships
    user_dto = AuthService.user_to_read_dto(user)
    return RegisterResponse(user=user_dto)


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    return AuthService.user_to_read_dto(current_user)


@router.post("/invite-store-admin", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def invite_store_admin(
    data: InviteStoreAdminRequest,
    request: Request,
    current_user: User = Depends(require_platform_admin),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Platform admin creates (or extends) a user account with a specific role on a store.
    Use this to onboard store admins, staff, or any role other than the default 'customer'.
    """
    ip_address = request.client.host if request.client else None
    user = await AuthService.invite_store_admin(
        session=session,
        data=data,
        ip_address=ip_address,
    )
    await session.commit()
    user_dto = AuthService.user_to_read_dto(user)
    return RegisterResponse(user=user_dto, message=f"User '{user.email}' has been assigned role '{data.role}' on store '{data.store_slug}'.")
