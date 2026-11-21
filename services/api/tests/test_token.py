from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from jose import jwt

from app.auth import get_current_user, read_session
from app.security import create_access_token, get_settings
from app.storage import IdentityStore


def test_valid_token_resolves_only_the_subject_user_and_profile(
    identity_store: IdentityStore, registered_user: dict
) -> None:
    token = create_access_token(registered_user["id"], registered_user["auth_version"])

    current = get_current_user(token, identity_store)
    session = read_session(current, identity_store)

    assert current["id"] == registered_user["id"]
    assert session["email"] == registered_user["email"]
    assert session["profile"]["user_id"] == registered_user["id"]
    assert "hashed_password" not in session


def test_current_user_rejects_expired_token(identity_store: IdentityStore, registered_user: dict) -> None:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expired = jwt.encode(
        {
            "sub": registered_user["id"],
            "ver": registered_user["auth_version"],
            "iat": now - timedelta(minutes=2),
            "exp": now - timedelta(seconds=1),
        },
        settings.secret_key,
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as error:
        get_current_user(expired, identity_store)

    assert error.value.status_code == 401


@pytest.mark.parametrize("token", ["malformed", "", "not.a.jwt"])
def test_current_user_rejects_malformed_tokens(token: str, identity_store: IdentityStore) -> None:
    with pytest.raises(HTTPException) as error:
        get_current_user(token, identity_store)
    assert error.value.status_code == 401


def test_current_user_rejects_revoked_version_deleted_or_inactive_user(
    identity_store: IdentityStore, registered_user: dict
) -> None:
    token = create_access_token(registered_user["id"], registered_user["auth_version"])

    identity_store.update_user(registered_user["id"], {"password": "new-password-456"})
    with pytest.raises(HTTPException):
        get_current_user(token, identity_store)

    current = identity_store.get_user(registered_user["id"])
    assert current is not None
    refreshed = create_access_token(current["id"], current["auth_version"])
    identity_store.update_user(current["id"], {"is_active": False})
    with pytest.raises(HTTPException):
        get_current_user(refreshed, identity_store)

    identity_store.delete_user(current["id"])
    with pytest.raises(HTTPException):
        get_current_user(refreshed, identity_store)
