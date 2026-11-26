import uuid
from datetime import timedelta

import pytest

from app.auth.jwt import create_access_token, decode_access_token
from app.core.errors import UnauthorizedError


def test_access_token_creation_and_decode():
    user_id = uuid.uuid4()
    email = "test@example.com"
    memberships = [{"store_id": str(uuid.uuid4()), "store_slug": "store-one", "role": "store_admin"}]

    token = create_access_token(
        user_id=user_id,
        email=email,
        is_platform_admin=False,
        memberships=memberships,
    )

    payload = decode_access_token(token)

    assert payload.sub == str(user_id)
    assert payload.email == email
    assert payload.is_platform_admin is False
    assert len(payload.memberships) == 1
    assert payload.memberships[0].store_slug == "store-one"
    assert payload.memberships[0].role == "store_admin"


def test_expired_token_raises_unauthorized():
    user_id = uuid.uuid4()
    token = create_access_token(
        user_id=user_id,
        email="test@example.com",
        expires_delta=timedelta(seconds=-10),  # Already expired
    )

    with pytest.raises(UnauthorizedError) as exc_info:
        decode_access_token(token)

    assert "expired" in str(exc_info.value.detail).lower()
