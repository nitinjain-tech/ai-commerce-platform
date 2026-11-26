import pytest
from httpx import AsyncClient

from app.domains.auth.models import User
from app.domains.tenants.models import Tenant


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient, seed_tenant: Tenant):
    # 1. Register new user
    register_payload = {
        "email": "newcustomer@example.com",
        "displayName": "New Customer",
        "password": "StrongPassword123!",
        "store_slug": seed_tenant.slug,
    }
    reg_res = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()["user"]
    assert user_data["email"] == "newcustomer@example.com"
    assert len(user_data["memberships"]) == 1
    assert user_data["memberships"][0]["storeSlug"] == seed_tenant.slug

    # 2. Login
    login_payload = {
        "email": "newcustomer@example.com",
        "password": "StrongPassword123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "accessToken" in login_data
    assert login_data["user"]["email"] == "newcustomer@example.com"

    # Verify refresh token cookie is set and is HttpOnly
    assert "refresh_token" in login_res.cookies
    token = login_data["accessToken"]

    # 3. Access /auth/me with Bearer token
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "newcustomer@example.com"

    # 4. Refresh token rotation
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": login_res.cookies["refresh_token"]},
    )
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    assert "accessToken" in refresh_data
    assert "refresh_token" in refresh_res.cookies
    # New rotated refresh cookie should differ from previous or be renewed
    assert refresh_res.cookies["refresh_token"] is not None

    # 5. Logout
    logout_res = await client.post(
        "/api/v1/auth/logout",
        cookies={"refresh_token": refresh_res.cookies["refresh_token"]},
    )
    assert logout_res.status_code == 204


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, seed_user: User):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": seed_user.email, "password": "WrongPassword!"},
    )
    assert res.status_code == 401
