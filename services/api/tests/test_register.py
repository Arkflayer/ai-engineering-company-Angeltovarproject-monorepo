from __future__ import annotations

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.domains.users import create_user
from app.models import UserRegistration
from app.security import verify_password
from app.storage import IdentityStore

PASSWORD = "valid-password-123"


def test_register_creates_user_with_default_role_and_initial_profile(identity_store: IdentityStore) -> None:
    request = UserRegistration(
        email=" New.User@Example.com ", password=PASSWORD, name="New User", phone="555-0101"
    )

    created = create_user(request, identity_store)

    stored = identity_store.get_user(created["id"])
    profile = identity_store.get_profile(created["id"])
    assert created["role"] == "user"
    assert stored is not None and verify_password(PASSWORD, stored["hashed_password"])
    assert profile is not None and profile["name"] == "New User"
    assert profile["phone"] == "555-0101"


def test_register_accepts_optional_profile_fields_at_empty_boundary(identity_store: IdentityStore) -> None:
    request = UserRegistration(email="minimal@example.com", password=PASSWORD)

    created = create_user(request, identity_store)

    assert identity_store.get_profile(created["id"])["name"] == ""
    assert identity_store.get_profile(created["id"])["phone"] is None


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "bad-email", "password": PASSWORD},
        {"email": "valid@example.com", "password": "short"},
        {"email": "valid@example.com", "password": "x" * 73},
        {"email": "valid@example.com", "password": PASSWORD, "role": "admin"},
    ],
)
def test_register_rejects_invalid_or_privileged_input_without_writing(
    identity_store: IdentityStore, payload: dict
) -> None:
    with pytest.raises(ValidationError):
        UserRegistration.model_validate(payload)
    assert identity_store.list_users() == []


def test_register_duplicate_email_is_conflict_and_does_not_duplicate_profile(
    identity_store: IdentityStore,
) -> None:
    request = UserRegistration(email="duplicate@example.com", password=PASSWORD)
    create_user(request, identity_store)

    with pytest.raises(HTTPException) as error:
        create_user(request, identity_store)

    assert error.value.status_code == 409
    assert len(identity_store.list_users()) == 1
    assert len(identity_store.profiles) == 1
