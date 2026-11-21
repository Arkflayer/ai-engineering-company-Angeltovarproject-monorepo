from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.domains.profiles import (
    MyProfileUpdate,
    ProfileFields,
    ProfileUpdate,
    create_profile,
    delete_profile,
    list_profiles,
    read_my_profile,
    read_profile,
    update_my_profile,
    update_profile,
)
from app.storage import IdentityStore


def test_owner_can_read_list_and_partially_update_profile(
    identity_store: IdentityStore, registered_user: dict
) -> None:
    profile = read_my_profile(registered_user, identity_store)
    assert profile["name"] == "Test User"
    assert len(list_profiles(registered_user, identity_store)) == 1

    updated = update_my_profile(
        MyProfileUpdate(phone=None, address="Fictional address"), registered_user, identity_store
    )
    assert updated["name"] == "Test User"
    assert updated["phone"] is None
    assert updated["address"] == "Fictional address"


def test_profile_validation_rejects_empty_patch_credentials_and_invalid_lengths() -> None:
    for payload in ({}, {"email": "user@example.com"}, {"password": "secret"}, {"name": None}):
        with pytest.raises(ValidationError):
            MyProfileUpdate.model_validate(payload)
    with pytest.raises(ValidationError):
        ProfileUpdate.model_validate({"contact_email": "not-an-email"})
    with pytest.raises(ValidationError):
        MyProfileUpdate.model_validate({"address": "x" * 501})


def test_profile_missing_and_cross_account_access_are_rejected(
    identity_store: IdentityStore, registered_user: dict
) -> None:
    other = identity_store.create_user("profile.other@example.com", "valid-password-456")

    with pytest.raises(HTTPException) as forbidden:
        read_profile(other["id"], registered_user, identity_store)
    assert forbidden.value.status_code == 403
    with pytest.raises(HTTPException) as forbidden_update:
        update_profile(
            other["id"], ProfileUpdate(name="Tamper"), registered_user, identity_store
        )
    assert forbidden_update.value.status_code == 403

    identity_store.delete_profile(registered_user["id"])
    with pytest.raises(HTTPException) as missing:
        read_my_profile(registered_user, identity_store)
    assert missing.value.status_code == 404
    assert list_profiles(registered_user, identity_store) == []
    with pytest.raises(HTTPException) as missing_update:
        update_my_profile(MyProfileUpdate(name="No profile"), registered_user, identity_store)
    assert missing_update.value.status_code == 404


def test_create_profile_rejects_duplicate_and_delete_is_blocked_while_linked(
    identity_store: IdentityStore, registered_user: dict
) -> None:
    with pytest.raises(HTTPException) as duplicate:
        create_profile(ProfileFields(name="Duplicate"), registered_user, identity_store)
    assert duplicate.value.status_code == 409

    with pytest.raises(HTTPException) as blocked:
        delete_profile(registered_user["id"], registered_user, identity_store)
    assert blocked.value.status_code == 409

    with pytest.raises(HTTPException) as missing:
        read_profile(str(uuid4()), registered_user, identity_store)
    assert missing.value.status_code == 403
