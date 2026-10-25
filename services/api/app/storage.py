"""Persistencia local de identidad en TinyDB, para un único proceso."""
from __future__ import annotations

from pathlib import Path
from threading import RLock
from uuid import uuid4

from tinydb import Query, TinyDB

from app.models import Profile, ProfileFields, User, UserRole
from app.security import hash_password


def _profile_condition(user_id: str):
    profile = Query()
    return (profile.user_id == user_id) | (profile.user_uuid == user_id)


class IdentityStore:
    def __init__(self, path: str):
        location = Path(path)
        location.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        location.touch(mode=0o600, exist_ok=True)
        self.db = TinyDB(location)
        self.users = self.db.table("users")
        self.profiles = self.db.table("profiles")
        self.lock = RLock()

    def close(self) -> None:
        self.db.close()

    def get_user(self, user_uuid: str) -> dict | None:
        with self.lock:
            user = self.users.get(Query().id == user_uuid)
            return dict(user) if user else None

    def find_user(self, email: str) -> dict | None:
        with self.lock:
            user = self.users.get(Query().email == email.strip().casefold())
            return dict(user) if user else None

    def list_users(self) -> list[dict]:
        with self.lock:
            return [dict(user) for user in self.users.all()]

    def create_user(
        self, email: str, password: str, *, bootstrap: bool = False, profile_fields: dict | None = None
    ) -> dict:
        initial_profile = ProfileFields.model_validate(profile_fields or {})
        hashed = hash_password(password)
        with self.lock:
            if bootstrap and len(self.users):
                raise ValueError("El alta inicial solo se permite cuando no existen usuarios.")
            email = email.strip().casefold()
            if self.find_user(email):
                raise ValueError("El email ya está registrado.")
            user = User(
                email=email, hashed_password=hashed,
                role=UserRole.ADMIN if bootstrap else UserRole.USER,
            ).model_dump(mode="json")
            self.users.insert(user)
            try:
                self.create_profile(user["id"], initial_profile.model_dump(mode="json"))
            except Exception:
                self.users.remove(Query().id == user["id"])
                raise
            return dict(user)

    def update_user(self, user_uuid: str, changes: dict) -> dict:
        updates = dict(changes)
        password = updates.pop("password", None)
        if password is not None:
            updates["hashed_password"] = hash_password(password)
            updates["auth_version"] = str(uuid4())
        if "role" in updates:
            updates["role"] = UserRole(updates["role"]).value
            updates["auth_version"] = str(uuid4())
        with self.lock:
            if "email" in updates:
                updates["email"] = updates["email"].strip().casefold()
                existing = self.find_user(updates["email"])
                if existing and existing["id"] != user_uuid:
                    raise ValueError("El email ya está registrado.")
            def apply_updates(document):
                document.update(updates)
                if "hashed_password" in updates:
                    document.pop("password_hash", None)

            self.users.update(apply_updates, Query().id == user_uuid)
            return self.get_user(user_uuid)

    def delete_user(self, user_uuid: str) -> None:
        with self.lock:
            self.profiles.remove(_profile_condition(user_uuid))
            self.users.remove(Query().id == user_uuid)

    def get_profile(self, user_uuid: str) -> dict | None:
        with self.lock:
            profile = self.profiles.get(_profile_condition(user_uuid))
            return Profile.model_validate(profile).model_dump(mode="json") if profile else None

    def create_profile(self, user_uuid: str, fields: dict) -> dict:
        with self.lock:
            if self.get_profile(user_uuid):
                raise ValueError("El usuario ya tiene un perfil.")
            if not self.get_user(user_uuid):
                raise ValueError("El usuario no existe.")
            validated = ProfileFields.model_validate(fields)
            profile = Profile(user_id=user_uuid, **validated.model_dump()).model_dump(mode="json")
            self.profiles.insert(profile)
            return dict(profile)

    def update_profile(self, user_uuid: str, fields: dict) -> dict | None:
        updates = ProfileFields.model_validate(fields).model_dump(mode="json", exclude_unset=True)
        with self.lock:
            if self.get_profile(user_uuid) is None:
                return None

            def apply_updates(document):
                profile = Profile.model_validate(document).model_dump(mode="json")
                profile.update(updates)
                document.clear()
                document.update(profile)

            self.profiles.update(apply_updates, _profile_condition(user_uuid))
            return self.get_profile(user_uuid)

    def delete_profile(self, user_uuid: str) -> None:
        with self.lock:
            self.profiles.remove(_profile_condition(user_uuid))