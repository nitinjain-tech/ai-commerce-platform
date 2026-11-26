import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.rls import set_tenant_rls_context
from app.domains.auth.models import Membership, User
from app.domains.tenants.models import Tenant


@pytest.mark.asyncio
async def test_membership_tenant_scoping(db_session: AsyncSession):
    # Create two distinct tenants
    t1 = Tenant(id=uuid.uuid4(), name="Store Alpha", slug="store-alpha", is_active=True)
    t2 = Tenant(id=uuid.uuid4(), name="Store Beta", slug="store-beta", is_active=True)
    db_session.add_all([t1, t2])
    await db_session.flush()

    # Create two users
    u1 = User(
        id=uuid.uuid4(),
        email="u1@example.com",
        password_hash="hash1",
        display_name="User 1",
        is_active=True,
    )
    u2 = User(
        id=uuid.uuid4(),
        email="u2@example.com",
        password_hash="hash2",
        display_name="User 2",
        is_active=True,
    )
    db_session.add_all([u1, u2])
    await db_session.flush()

    # Assign u1 to store-alpha, u2 to store-beta
    m1 = Membership(id=uuid.uuid4(), user_id=u1.id, tenant_id=t1.id, role="store_admin")
    m2 = Membership(id=uuid.uuid4(), user_id=u2.id, tenant_id=t2.id, role="customer")
    db_session.add_all([m1, m2])
    await db_session.commit()

    # Test setting RLS context does not raise on SQLite engine
    await set_tenant_rls_context(db_session, tenant_id=t1.id)

    # Query memberships for tenant 1
    stmt1 = select(Membership).where(Membership.tenant_id == t1.id)
    res1 = (await db_session.execute(stmt1)).scalars().all()
    assert len(res1) == 1
    assert res1[0].user_id == u1.id

    # Query memberships for tenant 2
    stmt2 = select(Membership).where(Membership.tenant_id == t2.id)
    res2 = (await db_session.execute(stmt2)).scalars().all()
    assert len(res2) == 1
    assert res2[0].user_id == u2.id
