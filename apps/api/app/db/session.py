from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.db.rls import set_tenant_rls_context
from app.tenants.context import get_tenant_context

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a raw database session without automatic RLS context."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_tenant_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a database session automatically configured with the current
    request's tenant context via PostgreSQL SET LOCAL.
    """
    async with async_session_maker() as session:
        async with session.begin():
            tenant_ctx = get_tenant_context()
            if tenant_ctx:
                await set_tenant_rls_context(
                    session=session,
                    tenant_id=tenant_ctx.tenant_id,
                    is_platform_admin=tenant_ctx.is_platform_admin,
                )
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
