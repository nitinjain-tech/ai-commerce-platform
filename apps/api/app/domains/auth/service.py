import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import generate_secure_token, hash_password, hash_token, verify_password
from app.db.rls import set_tenant_rls_context
from app.domains.auth.models import AuditLog, Membership, RefreshToken, User
from app.domains.auth.schemas import InviteStoreAdminRequest, MembershipRead, UserCreate, UserRead
from app.domains.tenants.service import TenantService

settings = get_settings()


class AuthService:
    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
        await set_tenant_rls_context(session, is_platform_admin=True)
        stmt = (
            select(User)
            .options(selectinload(User.memberships).selectinload(Membership.tenant))
            .where(User.email == email.lower().strip())
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID | str) -> Optional[User]:
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except ValueError:
                return None
        await set_tenant_rls_context(session, is_platform_admin=True)
        stmt = (
            select(User)
            .options(selectinload(User.memberships).selectinload(Membership.tenant))
            .where(User.id == user_id)
            .execution_options(populate_existing=True)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    def user_to_read_dto(user: User) -> UserRead:
        memberships_dto = []
        for m in user.memberships:
            if m.is_active and m.tenant and m.tenant.is_active:
                memberships_dto.append(
                    MembershipRead(
                        store_id=m.tenant.id,
                        store_slug=m.tenant.slug,
                        store_name=m.tenant.name,
                        role=m.role,
                    )
                )
        return UserRead(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            is_platform_admin=user.is_platform_admin,
            memberships=memberships_dto,
        )

    @staticmethod
    async def register_user(
        session: AsyncSession,
        data: UserCreate,
        ip_address: Optional[str] = None,
    ) -> User:
        await set_tenant_rls_context(session, is_platform_admin=True)
        clean_email = data.email.lower().strip()
        existing = await AuthService.get_user_by_email(session, clean_email)
        if existing:
            raise ConflictError(detail="An account with this email already exists.")

        user = User(
            email=clean_email,
            password_hash=hash_password(data.password),
            display_name=data.display_name,
            is_active=True,
            is_platform_admin=False,
        )
        session.add(user)
        await session.flush()

        # If a store slug is provided on registration, create customer membership
        if data.store_slug:
            tenant = await TenantService.get_by_slug(session, data.store_slug)
            if tenant and tenant.is_active:
                membership = Membership(
                    user_id=user.id,
                    tenant_id=tenant.id,
                    role="customer",
                    is_active=True,
                )
                session.add(membership)
                await session.flush()

        await AuthService.log_audit_event(
            session=session,
            tenant_id=None,
            user_id=user.id,
            action="auth.registered",
            resource_type="user",
            resource_id=str(user.id),
            details={"email": user.email},
            ip_address=ip_address,
        )

        return await AuthService.get_user_by_id(session, user.id) or user

    @staticmethod
    async def invite_store_admin(
        session: AsyncSession,
        data: InviteStoreAdminRequest,
        ip_address: Optional[str] = None,
    ) -> User:
        """
        Platform admin creates a user and assigns them a store_admin (or any role) membership.
        Unlike register_user (which only assigns 'customer'), this supports any role.
        """
        await set_tenant_rls_context(session, is_platform_admin=True)
        clean_email = data.email.lower().strip()
        existing = await AuthService.get_user_by_email(session, clean_email)

        if existing:
            # User already exists — just add the membership if not already present
            user = existing
        else:
            user = User(
                email=clean_email,
                password_hash=hash_password(data.password),
                display_name=data.display_name,
                is_active=True,
                is_platform_admin=False,
            )
            session.add(user)
            await session.flush()

        tenant = await TenantService.get_by_slug(session, data.store_slug)
        if not tenant or not tenant.is_active:
            from app.core.errors import NotFoundError
            raise NotFoundError(detail=f"Store '{data.store_slug}' not found or inactive.")

        # Check if membership already exists
        from sqlalchemy import and_
        existing_membership_stmt = select(Membership).where(
            and_(Membership.user_id == user.id, Membership.tenant_id == tenant.id)
        )
        existing_membership = (await session.execute(existing_membership_stmt)).scalar_one_or_none()

        allowed_roles = {"store_admin", "store_staff", "customer"}
        role = data.role if data.role in allowed_roles else "store_admin"

        if existing_membership:
            existing_membership.role = role
            existing_membership.is_active = True
        else:
            membership = Membership(
                user_id=user.id,
                tenant_id=tenant.id,
                role=role,
                is_active=True,
            )
            session.add(membership)

        await session.flush()

        await AuthService.log_audit_event(
            session=session,
            tenant_id=tenant.id,
            user_id=user.id,
            action="auth.invite_store_admin",
            resource_type="membership",
            resource_id=str(user.id),
            details={"email": user.email, "role": role, "store_slug": data.store_slug},
            ip_address=ip_address,
        )

        return await AuthService.get_user_by_id(session, user.id) or user

    @staticmethod
    async def authenticate_user(
        session: AsyncSession,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
    ) -> User:
        user = await AuthService.get_user_by_email(session, email)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError(detail="Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedError(detail="User account is deactivated.")

        await AuthService.log_audit_event(
            session=session,
            tenant_id=None,
            user_id=user.id,
            action="auth.login_success",
            resource_type="user",
            resource_id=str(user.id),
            details={"email": user.email},
            ip_address=ip_address,
        )

        return user

    @staticmethod
    async def create_refresh_token(
        session: AsyncSession,
        user_id: uuid.UUID,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        raw_token = generate_secure_token(48)
        hashed = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=hashed,
            expires_at=expires_at,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address[:45] if ip_address else None,
        )
        session.add(refresh_token)
        await session.flush()
        return raw_token

    @staticmethod
    async def rotate_refresh_token(
        session: AsyncSession,
        raw_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[User, str]:
        """
        Validates refresh token, marks it as revoked, and issues a new one (Token Rotation).
        """
        await set_tenant_rls_context(session, is_platform_admin=True)
        token_hash = hash_token(raw_token)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await session.execute(stmt)
        token_record = result.scalar_one_or_none()

        if not token_record:
            raise UnauthorizedError(detail="Invalid refresh token.")

        if token_record.revoked_at is not None:
            # Possible token reuse/replay attack: revoke all tokens for this user!
            await session.execute(
                update(RefreshToken)
                .where(RefreshToken.user_id == token_record.user_id)
                .values(revoked_at=datetime.now(timezone.utc))
            )
            await session.flush()
            raise UnauthorizedError(detail="Refresh token already revoked. Session invalidated.")

        now = datetime.now(timezone.utc)
        expires_at = (
            token_record.expires_at
            if token_record.expires_at.tzinfo is not None
            else token_record.expires_at.replace(tzinfo=timezone.utc)
        )
        if expires_at < now:
            raise UnauthorizedError(detail="Refresh token has expired.")

        # Revoke current token
        token_record.revoked_at = now

        # Load user
        user = await AuthService.get_user_by_id(session, token_record.user_id)
        if not user or not user.is_active:
            raise UnauthorizedError(detail="User is inactive or not found.")

        # Issue new token
        new_raw_token = await AuthService.create_refresh_token(
            session=session,
            user_id=user.id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return user, new_raw_token

    @staticmethod
    async def revoke_refresh_token(session: AsyncSession, raw_token: str) -> None:
        token_hash = hash_token(raw_token)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await session.execute(stmt)
        token_record = result.scalar_one_or_none()
        if token_record and token_record.revoked_at is None:
            token_record.revoked_at = datetime.now(timezone.utc)
            await session.flush()

    @staticmethod
    async def assign_membership(
        session: AsyncSession,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        role: str,
    ) -> Membership:
        await set_tenant_rls_context(session, is_platform_admin=True)
        stmt = (
            select(Membership)
            .where(Membership.user_id == user_id)
            .where(Membership.tenant_id == tenant_id)
        )
        result = await session.execute(stmt)
        membership = result.scalar_one_or_none()
        if membership:
            membership.role = role
            membership.is_active = True
        else:
            membership = Membership(
                user_id=user_id,
                tenant_id=tenant_id,
                role=role,
                is_active=True,
            )
            session.add(membership)
        await session.flush()
        return membership

    @staticmethod
    async def log_audit_event(
        session: AsyncSession,
        tenant_id: Optional[uuid.UUID],
        user_id: Optional[uuid.UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        log_entry = AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
        )
        session.add(log_entry)
        await session.flush()
        return log_entry
