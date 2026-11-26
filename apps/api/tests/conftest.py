import os
import sys
import uuid
from pathlib import Path
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Ensure app is discoverable on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Set test environment
os.environ["ENVIRONMENT"] = "testing"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-pytest-runs-only-min-32-chars"

import app.db.session as db_session
import app.tenants.middleware as tenant_middleware
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db_session
from app.domains.auth.models import Membership, User
from app.domains.tenants.models import Tenant
from app.main import app

# In-memory SQLite for fast, self-contained unit and API tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

db_session.async_session_maker = TestingSessionLocal
tenant_middleware.async_session_maker = TestingSessionLocal


@pytest.fixture
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(setup_test_db) -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db_session():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def seed_tenant(db_session: AsyncSession) -> Tenant:
    tenant = Tenant(
        id=uuid.uuid4(),
        name="Apex Athletics",
        slug="apex-athletics",
        domain="apex.localhost",
        is_active=True,
    )
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest.fixture
async def seed_user(db_session: AsyncSession, seed_tenant: Tenant) -> User:
    user = User(
        id=uuid.uuid4(),
        email="shopper@example.com",
        password_hash=hash_password("CustomerPass123!"),
        display_name="Jane Shopper",
        is_active=True,
        is_platform_admin=False,
    )
    db_session.add(user)
    await db_session.flush()

    membership = Membership(
        user_id=user.id,
        tenant_id=seed_tenant.id,
        role="customer",
        is_active=True,
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def seed_platform_admin(db_session: AsyncSession) -> User:
    admin = User(
        id=uuid.uuid4(),
        email="superadmin@platform.local",
        password_hash=hash_password("SuperAdminPass123!"),
        display_name="Platform Admin",
        is_active=True,
        is_platform_admin=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin
