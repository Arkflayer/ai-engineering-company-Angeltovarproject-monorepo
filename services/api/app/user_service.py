"""Operaciones de usuarios independientes de HTTP sobre la persistencia TinyDB."""
from __future__ import annotations

from app.models import UserAdminUpdate, UserRegistration, UserUpdate
from app.storage import IdentityStore


class UserNotFoundError(LookupError):
    """La cuenta solicitada no existe en el almacén de identidad."""


def create_user(
    store: IdentityStore,
    email: str,
    password: str,
    *,
    bootstrap: bool = False,
    name: str | None = None,
    phone: str | None = None,
    address: str | None = None,
) -> dict:
    data = UserRegistration(email=email, password=password, name=name, phone=phone, address=address)
    return store.create_user(
        str(data.email),
        data.password.get_secret_value(),
        bootstrap=bootstrap,
        profile_fields={"name": data.name or "", "phone": data.phone, "address": data.address},
    )


def get_user_by_id(store: IdentityStore, user_uuid: str) -> dict | None:
    return store.get_user(user_uuid)


def get_user_by_email(store: IdentityStore, email: str) -> dict | None:
    return store.find_user(email)


def list_users(store: IdentityStore) -> list[dict]:
    return store.list_users()


def update_user(
    store: IdentityStore, user_uuid: str, changes: dict, *, allow_role_change: bool = False
) -> dict:
    schema = UserAdminUpdate if allow_role_change else UserUpdate
    data = schema.model_validate(changes)
    updates = data.model_dump(exclude_unset=True)
    if data.password is not None:
        updates["password"] = data.password.get_secret_value()
    with store.lock:
        if get_user_by_id(store, user_uuid) is None:
            raise UserNotFoundError("Usuario no encontrado.")
        return store.update_user(user_uuid, updates)


def delete_user(store: IdentityStore, user_uuid: str) -> None:
    with store.lock:
        if get_user_by_id(store, user_uuid) is None:
            raise UserNotFoundError("Usuario no encontrado.")
        store.delete_user(user_uuid)