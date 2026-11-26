import pytest
from httpx import AsyncClient

from app.auth.jwt import create_access_token
from app.domains.auth.models import User
from app.domains.tenants.models import Tenant


@pytest.mark.asyncio
async def test_get_tenant_by_slug(client: AsyncClient, seed_tenant: Tenant):
    res = await client.get(f"/api/v1/tenants/{seed_tenant.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == seed_tenant.slug
    assert data["name"] == seed_tenant.name


@pytest.mark.asyncio
async def test_get_tenant_current_via_header(client: AsyncClient, seed_tenant: Tenant):
    res = await client.get(
        "/api/v1/tenants/current",
        headers={"X-Tenant-Slug": seed_tenant.slug},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == seed_tenant.slug


@pytest.mark.asyncio
async def test_create_tenant_platform_admin_only(
    client: AsyncClient, seed_platform_admin: User, seed_user: User
):
    admin_token = create_access_token(
        user_id=seed_platform_admin.id,
        email=seed_platform_admin.email,
        is_platform_admin=True,
    )
    customer_token = create_access_token(
        user_id=seed_user.id,
        email=seed_user.email,
        is_platform_admin=False,
    )

    new_tenant_payload = {
        "name": "Nordic Timber",
        "slug": "nordic-timber",
        "domain": "timber.localhost",
    }

    # Forbidden for customer
    customer_res = await client.post(
        "/api/v1/tenants",
        json=new_tenant_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert customer_res.status_code == 403

    # Allowed for platform admin
    admin_res = await client.post(
        "/api/v1/tenants",
        json=new_tenant_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_res.status_code == 201
    assert admin_res.json()["slug"] == "nordic-timber"
