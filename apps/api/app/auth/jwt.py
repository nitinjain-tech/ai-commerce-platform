import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import jwt
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.errors import UnauthorizedError

settings = get_settings()


class TokenMembership(BaseModel):
    store_id: str
    store_slug: str
    role: str


class TokenPayload(BaseModel):
    sub: str  # user id as string
    email: str
    is_platform_admin: bool = False
    memberships: List[TokenMembership] = []
    exp: datetime
    iat: datetime
    jti: Optional[str] = None


def create_access_token(
    user_id: uuid.UUID,
    email: str,
    is_platform_admin: bool = False,
    memberships: Optional[List[Dict[str, Any]]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    formatted_memberships = []
    if memberships:
        for m in memberships:
            formatted_memberships.append({
                "store_id": str(m.get("store_id") or m.get("tenant_id")),
                "store_slug": m.get("store_slug", ""),
                "role": m.get("role", "customer"),
            })

    payload = {
        "sub": str(user_id),
        "email": email,
        "is_platform_admin": is_platform_admin,
        "memberships": formatted_memberships,
        "iat": now,
        "exp": expire,
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> TokenPayload:
    try:
        decoded = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return TokenPayload(**decoded)
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(detail="Access token has expired.")
    except jwt.InvalidTokenError:
        raise UnauthorizedError(detail="Invalid access token.")
