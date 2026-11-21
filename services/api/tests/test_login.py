from __future__ import annotations

import pytest
from jose import jwt
from pydantic import ValidationError

from app.auth import LoginRequest, login, unauthorized
from app.security import decode_access_token
from app.storage import IdentityStore

PASSWORD = "valid-password-123"


def test_login_issues_a_verifiable_token_for_active_user(identity_store: IdentityStore) -> None:
    user = identity_store.create_user("login@example.com", PASSWORD)

    result = login(LoginRequest(email="login@example.com", password=PASSWORD), identity_store)

    claims = decode_access_token(result.access_token)
    assert claims["sub"] == user["id"]
    assert claims["ver"] == user["auth_version"]
    assert result.token_type == "bearer"
    assert result.expires_in == 1800


@pytest.mark.parametrize("password", ["", "x" * 73])
def test_login_rejects_empty_or_overlong_password_before_authentication(password: str) -> None:
    with pytest.raises(ValidationError):
        LoginRequest(email="login@example.com", password=password)


def test_login_rejects_wrong_password_unknown_and_inactive_accounts(identity_store: IdentityStore) -> None:
    user = identity_store.create_user("login@example.com", PASSWORD)

    for email, password in [
        ("login@example.com", "incorrect-password"),
        ("missing@example.com", PASSWORD),
    ]:
        with pytest.raises(Exception) as error:
            login(LoginRequest(email=email, password=password), identity_store)
        assert getattr(error.value, "status_code", None) == 401

    identity_store.update_user(user["id"], {"is_active": False})
    with pytest.raises(Exception) as error:
        login(LoginRequest(email="login@example.com", password=PASSWORD), identity_store)
    assert getattr(error.value, "status_code", None) == 401


def test_login_never_returns_password_hash(identity_store: IdentityStore) -> None:
    identity_store.create_user("login@example.com", PASSWORD)

    result = login(LoginRequest(email="login@example.com", password=PASSWORD), identity_store)

    assert not hasattr(result, "hashed_password")
    assert PASSWORD not in result.access_token
