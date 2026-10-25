"""Configuración, hash de credenciales y firma de sesiones."""
from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

ALGORITHM = "HS256"
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)
legacy_password_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
MAX_BCRYPT_PASSWORD_BYTES = 72


@dataclass(frozen=True)
class Settings:
    secret_key: str
    token_minutes: int
    db_path: str


@lru_cache
def get_settings() -> Settings:
    secret = os.environ.get("TRACKFLOW_JWT_SECRET", "")
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError("TRACKFLOW_JWT_SECRET debe contener al menos 32 bytes aleatorios.")
    expiration = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES")
    if not expiration:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES es obligatoria.")
    try:
        minutes = int(expiration)
    except ValueError as exc:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES debe ser un entero entre 1 y 1440.") from exc
    if not 1 <= minutes <= 1440:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES debe ser un entero entre 1 y 1440.")
    default_path = Path.home() / ".local" / "share" / "trackflow" / "identity.json"
    return Settings(secret, minutes, os.environ.get("TRACKFLOW_DB_PATH", str(default_path)))


def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError("La contraseña supera el máximo de 72 bytes admitido por bcrypt.")
    return bcrypt.using(truncate_error=True).hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith("$bcrypt-sha256$"):
        return legacy_password_context.verify(password, password_hash)
    if len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.verify(password, password_hash)
    except (TypeError, ValueError):
        return False


def create_access_token(user_uuid: str, auth_version: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_uuid,
            "ver": auth_version,
            "iat": now,
            "exp": now + timedelta(minutes=settings.token_minutes),
        },
        settings.secret_key,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        get_settings().secret_key,
        algorithms=[ALGORITHM],
        options={"require_sub": True, "require_exp": True, "require_iat": True},
    )