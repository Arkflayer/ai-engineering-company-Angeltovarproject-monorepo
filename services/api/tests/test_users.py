from __future__ import annotations

from threading import Lock
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.domains.users import delete_user, list_users, read_me, read_user, update_user
from app.models import UserAdminUpdate
from app.storage import IdentityStore


@pytest.fixture
def admin_user(identity_store: IdentityStore) -> dict:
    admin = identity_store.create_user("admin@example.com", "valid-password-123", bootstrap=True)
    return admin


def test_user_directory_and_me_return_expected_identity(identity_store: IdentityStore, registered_user: dict) -> None:
    assert [item["id"] for item in list_users(registered_user, identity_store)] == [registered_user["id"]]
    assert read_me(registered_user)["email"] == registered_user["email"]
    assert read_user(registered_user["id"], registered_user, identity_store)["id"] == registered_user["id"]


def test_read_user_not_found_and_cross_account_denied(identity_store: IdentityStore, registered_user: dict) -> None:
    other = identity_store.create_user("other@example.com", "valid-password-456")

    with pytest.raises(HTTPException) as missing:
        read_user(str(uuid4()), registered_user, identity_store)
    assert missing.value.status_code == 404
    with pytest.raises(HTTPException) as forbidden:
        read_user(other["id"], registered_user, identity_store)
    assert forbidden.value.status_code == 403


def test_owner_can_update_credentials_but_cannot_change_role(
    identity_store: IdentityStore, registered_user: dict
) -> None:
    result = update_user(
        registered_user["id"], UserAdminUpdate(email="renamed@example.com"),
        registered_user, identity_store,
    )
    assert result["email"] == "renamed@example.com"
    with pytest.raises(HTTPException) as error:
        update_user(
            registered_user["id"], UserAdminUpdate(role="admin"),
            registered_user, identity_store,
        )
    assert error.value.status_code == 403


def test_admin_updates_other_role_and_duplicate_or_invalid_updates_fail(
    identity_store: IdentityStore, admin_user: dict, registered_user: dict
) -> None:
    result = update_user(
        registered_user["id"], UserAdminUpdate(role="manager"), admin_user, identity_store
    )
    assert result["role"] == "manager"

    with pytest.raises(HTTPException) as duplicate:
        update_user(
            registered_user["id"], UserAdminUpdate(email=admin_user["email"]),
            admin_user, identity_store,
        )
    assert duplicate.value.status_code == 409

    with pytest.raises(ValidationError):
        UserAdminUpdate.model_validate({})
    with pytest.raises(HTTPException) as missing:
        update_user(str(uuid4()), UserAdminUpdate(email="valid@example.com"), admin_user, identity_store)
    assert missing.value.status_code == 404


def test_delete_admin_removes_user_and_profile_and_non_admin_cannot_delete(
    identity_store: IdentityStore, admin_user: dict, registered_user: dict
) -> None:
    request = SimpleNamespace(
        app=SimpleNamespace(state=SimpleNamespace(summary_lock=Lock(), summaries={registered_user["id"]: {}}))
    )
    with pytest.raises(HTTPException) as forbidden:
        delete_user(admin_user["id"], request, registered_user, identity_store)
    assert forbidden.value.status_code == 403

    delete_user(registered_user["id"], request, admin_user, identity_store)
    assert identity_store.get_user(registered_user["id"]) is None
    assert identity_store.get_profile(registered_user["id"]) is None
    assert registered_user["id"] not in request.app.state.summaries
    with pytest.raises(HTTPException) as missing:
        delete_user(registered_user["id"], request, registered_user, identity_store)
    assert missing.value.status_code == 404
