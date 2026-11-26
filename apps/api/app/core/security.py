import hashlib
import secrets

import bcrypt


def hash_password(password: str) -> str:
    """Hash password using bcrypt with standard 12 work factor (truncated to bcrypt's 72 bytes max)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password hash against plain text candidate."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a high-entropy random string for refresh tokens or verification codes."""
    return secrets.token_urlsafe(nbytes)


def hash_token(token: str) -> str:
    """Produce SHA-256 hex digest of a token so raw tokens are never stored at rest."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
