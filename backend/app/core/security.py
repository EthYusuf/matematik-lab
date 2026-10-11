"""Parola özeti (Argon2) ve JWT erişim/yenileme belirteçleri."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

_hasher = PasswordHash.recommended()  # Argon2id
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(password, hashed)
    except Exception:  # noqa: BLE001 — bozuk özet = geçersiz parola
        return False


def create_access_token(user_id: int) -> str:
    s = get_settings()
    now = datetime.now(UTC)
    payload = {"sub": str(user_id), "type": "access", "iat": now, "exp": now + timedelta(minutes=s.access_token_minutes)}
    return jwt.encode(payload, s.secret_key, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> tuple[str, str, datetime]:
    """(belirteç, jti, bitiş) döndürür; jti veritabanında saklanır ki iptal edilebilsin."""
    s = get_settings()
    jti = secrets.token_hex(24)
    expires = datetime.now(UTC) + timedelta(days=s.refresh_token_days)
    payload = {"sub": str(user_id), "type": "refresh", "jti": jti, "exp": expires}
    return jwt.encode(payload, s.secret_key, algorithm=ALGORITHM), jti, expires.replace(tzinfo=None)


def decode_token(token: str, expected_type: str) -> dict | None:
    try:
        payload = jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != expected_type or "sub" not in payload:
        return None
    return payload
