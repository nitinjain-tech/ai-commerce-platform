from app.core.security import generate_secure_token, hash_password, hash_token, verify_password


def test_password_hashing():
    raw = "MySuperSecretPassword#2026"
    hashed = hash_password(raw)

    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_token_generation_and_hashing():
    token1 = generate_secure_token(32)
    token2 = generate_secure_token(32)

    assert len(token1) > 20
    assert token1 != token2

    hash1 = hash_token(token1)
    hash2 = hash_token(token2)

    assert hash1 != hash2
    assert hash1 == hash_token(token1)
