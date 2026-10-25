import json
import io
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import redirect_stdout
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from jose import jwt

import support
from app import bootstrap
from app import user_service
from app.security import decode_access_token, get_settings
from app.storage import IdentityStore


class AuthEndpointsTests(support.ApiTestCase):
    def test_login_accepts_json_email_password_and_issues_valid_jwt(self):
        response = self.client.post("/auth/login", json={
            "email": "PERSONA@example.com", "password": support.PASSWORD,
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(set(data), {"access_token", "token_type", "expires_in"})
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["expires_in"], 1800)
        self.assertEqual(decode_access_token(data["access_token"])["sub"], self.user_uuid)
        self.assertNotIn(support.PASSWORD, response.text)
        session = self.client.get("/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        self.assertEqual(session.status_code, 200)
        self.assertEqual(session.json()["email"], self.user["email"])

    def test_login_accepts_email_form_and_preserves_oauth2_username_form(self):
        for field in ("email", "username"):
            with self.subTest(field=field):
                response = self.client.post("/auth/login", data={
                    field: self.user["email"], "password": support.PASSWORD, "grant_type": "password",
                })
                self.assertEqual(response.status_code, 200)
                self.assertEqual(decode_access_token(response.json()["access_token"])["sub"], self.user_uuid)

    def test_json_login_unknown_email_and_wrong_password_have_same_response(self):
        responses = [self.client.post("/auth/login", json={"email": email, "password": "incorrecta"})
                     for email in (self.user["email"], "desconocida@example.com")]
        self.assertEqual(responses[0].json(), responses[1].json())
        for response in responses:
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.headers["www-authenticate"], "Bearer")

    def test_login_rejects_invalid_bodies_without_echoing_password(self):
        for payload in (
            {"email": "no-es-un-email", "password": support.PASSWORD},
            {"email": self.user["email"]}, {"password": support.PASSWORD},
            {"email": self.user["email"], "password": support.PASSWORD, "role": "admin"},
            {"email": self.user["email"], "password": "x" * 1025}, [],
        ):
            with self.subTest(payload=payload):
                response = self.client.post("/auth/login", json=payload)
                self.assertEqual(response.status_code, 422)
                self.assertNotIn(support.PASSWORD, response.text)
        invalid_json = self.client.post("/auth/login", content="{", headers={"Content-Type": "application/json"})
        self.assertEqual(invalid_json.status_code, 400)
        unsupported = self.client.post("/auth/login", content="credenciales", headers={"Content-Type": "text/plain"})
        self.assertEqual(unsupported.status_code, 415)

    def test_auth_me_returns_own_email_role_and_linked_contact_without_secrets(self):
        from tinydb import Query

        self.store.update_profile(self.user_uuid, {
            "name": "Persona ficticia", "phone": "+34 000000000", "address": "Dirección ficticia",
            "contact_email": "contacto@example.com",
        })
        other = self.store.create_user("otra-identidad@example.com", support.PASSWORD)
        self.store.update_profile(other["id"], {"name": "Otro perfil"})
        self.store.users.update({"role": "manager"}, Query().id == self.user_uuid)
        response = self.client.get(f"/auth/me?user_id={other['id']}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "email": self.user["email"], "role": "manager", "profile": self.store.get_profile(self.user_uuid),
        })
        self.assertNotIn(other["email"], response.text)
        self.assertNotIn("Otro perfil", response.text)
        for secret in ("hashed_password", "password_hash", "auth_version", support.PASSWORD):
            self.assertNotIn(secret, response.text)

    def test_auth_me_requires_valid_session_and_rejects_expired_token(self):
        secret = get_settings().secret_key
        now = datetime.now(timezone.utc)
        expired = jwt.encode({
            "sub": self.user_uuid, "ver": self.user["auth_version"], "iat": now,
            "exp": now - timedelta(seconds=1),
        }, secret, algorithm="HS256")
        for headers in ({}, {"Authorization": "Bearer no-valido"}, {"Authorization": f"Bearer {expired}"}):
            with self.subTest(headers=headers):
                response = self.client.get("/auth/me", headers=headers)
                self.assertEqual(response.status_code, 401)
                self.assertEqual(response.headers["www-authenticate"], "Bearer")

    def test_auth_me_and_json_login_reject_inactive_or_deleted_user(self):
        from tinydb import Query

        self.store.users.update({"is_active": False}, Query().id == self.user_uuid)
        inactive = self.client.post("/auth/login", json={"email": self.user["email"], "password": support.PASSWORD})
        self.assertEqual(inactive.status_code, 401)
        self.assertEqual(self.client.get("/auth/me", headers=self.headers).status_code, 401)
        self.store.delete_user(self.user_uuid)
        self.assertEqual(self.client.get("/auth/me", headers=self.headers).status_code, 401)

    def test_auth_me_without_profile_returns_null_without_recreating_it(self):
        self.store.delete_profile(self.user_uuid)
        response = self.client.get("/auth/me", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"email": self.user["email"], "role": "user", "profile": None})
        self.assertIsNone(self.store.get_profile(self.user_uuid))

    def test_openapi_documents_json_email_and_oauth2_compatible_login(self):
        schema = self.client.get("/openapi.json").json()
        content = schema["paths"]["/auth/login"]["post"]["requestBody"]["content"]
        self.assertEqual(set(content["application/json"]["schema"]["required"]), {"email", "password"})
        self.assertIn("application/x-www-form-urlencoded", content)
        self.assertTrue(schema["paths"]["/auth/me"]["get"]["security"])


class AuthApiTests(support.ApiTestCase):
    def test_login_uses_stored_id_and_never_exposes_credentials(self):
        response = self.client.post("/auth/login", data={
            "username": "PERSONA@example.com", "password": support.PASSWORD,
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["expires_in"], 1800)
        claims = decode_access_token(data["access_token"])
        self.assertEqual(claims["sub"], self.user_uuid)
        self.assertNotIn("password", claims)
        self.assertNotIn("email", claims)
        record = self.store.get_user(claims["sub"])
        self.assertNotIn(support.PASSWORD, json.dumps(self.store.db.storage.read()))
        self.assertIn("hashed_password", record)
        self.assertNotIn("password_hash", record)
        public = self.client.get("/users/me", headers=self.headers)
        self.assertEqual(public.json(), {
            "id": self.user_uuid, "email": "persona@example.com", "role": "user",
            "is_active": True, "created_at": self.user["created_at"],
        })

    def test_unknown_email_and_wrong_password_have_identical_401(self):
        responses = [self.client.post("/auth/login", data={"username": email, "password": "incorrecta"})
                     for email in ("persona@example.com", "ausente@example.com")]
        self.assertEqual(responses[0].json(), responses[1].json())
        for response in responses:
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.headers["www-authenticate"], "Bearer")

    def test_user_persists_required_fields_without_profile_data(self):
        from uuid import UUID

        record = self.store.get_user(self.user_uuid)
        self.assertEqual(set(record), {
            "id", "email", "hashed_password", "is_active", "role", "created_at", "auth_version",
        })
        self.assertEqual(str(UUID(record["id"])), self.user_uuid)
        self.assertTrue(record["is_active"])
        self.assertEqual(record["role"], "user")
        created_at = datetime.fromisoformat(record["created_at"])
        self.assertEqual(created_at.utcoffset(), timedelta(0))
        self.assertLess(abs((datetime.now(timezone.utc) - created_at).total_seconds()), 60)
        self.assertNotEqual(record["hashed_password"], support.PASSWORD)
        self.assertNotIn("password", record)
        self.assertNotIn("display_name", record)
        self.assertNotIn("contact_email", record)
        self.assertNotIn("phone", record)
        response = self.client.patch(f"/users/{self.user_uuid}", headers=self.headers,
                                     json={"email": "actualizada@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.store.get_user(self.user_uuid)["created_at"], record["created_at"])

    def test_inactive_user_cannot_log_in_or_use_existing_token(self):
        from tinydb import Query

        self.store.users.update({"is_active": False}, Query().id == self.user_uuid)
        response = self.client.post("/auth/login", data={
            "username": self.user["email"], "password": support.PASSWORD,
        })
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.client.get("/users/me", headers=self.headers).status_code, 401)
        self.assertEqual(self.client.get("/api/incidents/results/export", headers=self.headers).status_code, 401)

    def test_client_cannot_assign_role_or_active_status(self):
        for field, value in (
            ("role", "admin"), ("role", "manager"), ("role", "user"), ("role", "owner"),
            ("is_active", False), ("created_at", "2020-01-01"),
        ):
            with self.subTest(field=field):
                created = self.client.post("/users", headers=self.headers, json={
                    "email": "sin-privilegios@example.com", "password": support.PASSWORD, field: value,
                })
                self.assertEqual(created.status_code, 422)
                changed = self.client.patch(f"/users/{self.user_uuid}", headers=self.headers,
                                            json={field: value})
                expected = 403 if field == "role" and value in ("admin", "manager", "user") else 422
                self.assertEqual(changed.status_code, expected)
        self.assertEqual(self.store.get_user(self.user_uuid)["role"], "user")
        self.assertTrue(self.store.get_user(self.user_uuid)["is_active"])

    def test_user_role_enum_accepts_only_admin_manager_or_user(self):
        from pydantic import ValidationError

        from app.models import User, UserRole

        self.assertEqual({role.value for role in UserRole}, {"admin", "manager", "user"})
        for role in ("admin", "manager", "user"):
            with self.subTest(role=role):
                user = User.model_validate({**self.user, "role": role})
                self.assertIsInstance(user.role, UserRole)
                self.assertEqual(user.model_dump(mode="json")["role"], role)
        for role in ("owner", "ADMIN", "Manager", " user ", "", None, 1, True):
            with self.subTest(role=role), self.assertRaises(ValidationError):
                User.model_validate({**self.user, "role": role})

    def test_post_users_defaults_to_user_role(self):
        created = self.client.post("/users", headers=self.headers, json={
            "email": "rol-por-defecto@example.com", "password": support.PASSWORD,
        })
        self.assertEqual(created.status_code, 201)
        record = self.store.get_user(created.json()["id"])
        self.assertEqual(record["role"], "user")

    def test_legacy_hash_remains_usable_and_is_renamed_on_password_change(self):
        from tinydb import Query

        def legacy_record(document):
            document["password_hash"] = document.pop("hashed_password")
            for field in ("is_active", "role", "created_at"):
                document.pop(field)

        self.store.users.update(legacy_record, Query().id == self.user_uuid)
        headers = self.login_headers(self.user["email"])
        self.assertNotIn("created_at", self.store.get_user(self.user_uuid))
        updated = self.client.patch(f"/users/{self.user_uuid}", headers=headers,
                                    json={"password": "nueva-contraseña-segura"})
        self.assertEqual(updated.status_code, 200)
        record = self.store.get_user(self.user_uuid)
        self.assertIn("hashed_password", record)
        self.assertNotIn("password_hash", record)
        self.login_headers(self.user["email"], "nueva-contraseña-segura")

    def test_identity_routes_require_authentication(self):
        routes = [
            ("GET", "/users"), ("GET", "/users/me"),
            ("GET", f"/users/{self.user_uuid}"), ("PATCH", f"/users/{self.user_uuid}"),
            ("PUT", f"/users/{self.user_uuid}"),
            ("DELETE", f"/users/{self.user_uuid}"), ("GET", "/profiles"),
            ("POST", "/profiles"), ("GET", "/profiles/me"), ("PUT", "/profiles/me"),
            ("GET", f"/profiles/{self.user_uuid}"),
            ("PATCH", f"/profiles/{self.user_uuid}"), ("DELETE", f"/profiles/{self.user_uuid}"),
        ]
        for method, path in routes:
            with self.subTest(method=method, path=path):
                response = self.client.request(method, path)
                self.assertEqual(response.status_code, 401)

    def test_user_registration_is_the_only_public_users_endpoint(self):
        response = self.client.post("/users", json={
            "email": "registro-publico@example.com", "password": support.PASSWORD,
            "name": "Cuenta de prueba",
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["role"], "user")
        self.assertIsNotNone(self.store.get_profile(response.json()["id"]))
        self.assertEqual(self.client.get("/users").status_code, 401)

    def test_invalid_tokens_are_rejected(self):
        now = datetime.now(timezone.utc)
        claims = {"sub": self.user_uuid, "ver": self.user["auth_version"], "iat": now,
                  "exp": now + timedelta(minutes=1)}
        secret = get_settings().secret_key
        variants = [
            "no-es-un-token",
            jwt.encode(claims, "clave-equivocada" * 4, algorithm="HS256"),
            jwt.encode({**claims, "exp": now - timedelta(seconds=1)}, secret, algorithm="HS256"),
            jwt.encode({**claims, "sub": "usuario-inexistente"}, secret, algorithm="HS256"),
            jwt.encode({key: value for key, value in claims.items() if key != "exp"}, secret, algorithm="HS256"),
            jwt.encode({**claims, "ver": 1}, secret, algorithm="HS256"),
            jwt.encode({key: value for key, value in claims.items() if key != "ver"}, secret, algorithm="HS256"),
            jwt.encode({**claims, "ver": "versión-no-válida"}, secret, algorithm="HS256"),
            jwt.encode({**claims, "sub": []}, secret, algorithm="HS256"),
            jwt.encode(claims, secret, algorithm="HS384"),
        ]
        for token in variants:
            with self.subTest(token=token):
                response = self.client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
                self.assertEqual(response.status_code, 401)

    def test_users_crud_duplicate_email_and_token_revocation(self):
        created = self.client.post("/users", headers=self.headers, json={
            "email": "segunda@example.com", "password": support.PASSWORD,
        })
        self.assertEqual(created.status_code, 201)
        second_id = created.json()["id"]
        self.assertIsNotNone(self.store.get_profile(second_id))
        duplicate = self.client.post("/users", headers=self.headers, json={
            "email": "SEGUNDA@example.com", "password": support.PASSWORD,
        })
        self.assertEqual(duplicate.status_code, 409)
        conflict = self.client.patch(f"/users/{self.user_uuid}", headers=self.headers,
                                     json={"email": "segunda@example.com"})
        self.assertEqual(conflict.status_code, 409)
        changed = self.client.patch(f"/users/{self.user_uuid}", headers=self.headers,
                                    json={"email": "nueva@example.com", "password": "otra-contraseña-segura"})
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.json()["email"], "nueva@example.com")
        self.assertEqual(self.client.get("/users/me", headers=self.headers).status_code, 401)
        new_headers = self.login_headers("nueva@example.com", "otra-contraseña-segura")
        removed = self.client.delete(f"/users/{self.user_uuid}", headers=new_headers)
        self.assertEqual(removed.status_code, 204)
        self.assertIsNone(self.store.get_profile(self.user_uuid))
        self.assertEqual(self.client.get("/users/me", headers=new_headers).status_code, 401)
        self.assertIsNotNone(self.store.get_user(second_id))

    def test_authenticated_directory_does_not_allow_cross_account_changes_or_profile_access(self):
        other = self.store.create_user("otra@example.com", support.PASSWORD)
        self.assertEqual(len(self.client.get("/users", headers=self.headers).json()), 2)
        self.assertEqual(self.client.get(f"/users/{other['id']}", headers=self.headers).status_code, 403)
        for method in ("PUT", "PATCH", "DELETE"):
            response = self.client.request(method, f"/users/{other['id']}", headers=self.headers,
                                           json={"email": "ajena@example.com"})
            self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.get(f"/users/{other['id']}", headers=self.headers).status_code, 403)
        self.assertEqual(len(self.client.get("/profiles", headers=self.headers).json()), 1)
        for method in ("GET", "PATCH", "DELETE"):
            response = self.client.request(method, f"/profiles/{other['id']}", headers=self.headers,
                                           json={"display_name": "Ajeno"})
            self.assertEqual(response.status_code, 403)
        self.assertEqual(self.store.get_user(other["id"])["email"], "otra@example.com")

    def test_profiles_crud_and_unique_relationship(self):
        path = f"/profiles/{self.user_uuid}"
        response = self.client.get(path, headers=self.headers)
        self.assertEqual(response.json()["user_id"], self.user_uuid)
        self.assertEqual(self.client.post("/profiles", headers=self.headers, json={}).status_code, 409)
        updated = self.client.patch(path, headers=self.headers, json={
            "display_name": "Persona de prueba", "contact_email": "contacto@example.com", "phone": "+34 000000000",
        })
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["name"], "Persona de prueba")
        self.assertNotIn("display_name", self.store.get_user(self.user_uuid))
        original_profile = self.store.get_profile(self.user_uuid)
        self.assertEqual(self.client.delete(path, headers=self.headers).status_code, 409)
        self.assertEqual(self.client.get(path, headers=self.headers).status_code, 200)
        self.assertEqual(self.store.get_profile(self.user_uuid), original_profile)

    def test_invalid_credentials_and_assignment_fields_are_rejected_without_echo(self):
        for body in (
            {"email": "invalido", "password": support.PASSWORD},
            {"email": "valido@example.com", "password": "corta"},
            {"email": "valido@example.com", "password": "á" * 37},
            {"email": "valido@example.com", "password": support.PASSWORD, "display_name": "Perfil"},
        ):
            response = self.client.post("/users", headers=self.headers, json=body)
            self.assertEqual(response.status_code, 422)
            self.assertNotIn(body["password"], response.text)
        for body in ({}, {"email": None}, {"password": None}):
            response = self.client.patch(f"/users/{self.user_uuid}", headers=self.headers, json=body)
            self.assertEqual(response.status_code, 422)
        response = self.client.patch(f"/profiles/{self.user_uuid}", headers=self.headers,
                                     json={"user_uuid": "otra-cuenta"})
        self.assertEqual(response.status_code, 422)

    def test_initial_account_cannot_be_recreated(self):
        with self.assertRaises(ValueError):
            self.store.create_user("bootstrap@example.com", support.PASSWORD, bootstrap=True)

    def test_bootstrap_command_creates_only_the_first_account_without_echoing_password(self):
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / "identity.json")
            with patch.dict("os.environ", {"TRACKFLOW_DB_PATH": path}), patch.object(
                sys, "argv", ["bootstrap", "--email", "inicial@example.com"]
            ), patch.object(bootstrap, "getpass", side_effect=[support.PASSWORD, support.PASSWORD]) as prompt:
                get_settings.cache_clear()
                try:
                    output = io.StringIO()
                    with redirect_stdout(output):
                        bootstrap.main()
                    self.assertNotIn(support.PASSWORD, output.getvalue())
                    self.assertEqual(prompt.call_count, 2)
                    stored = IdentityStore(path)
                    try:
                        user = stored.find_user("inicial@example.com")
                        self.assertEqual(user["role"], "admin")
                        self.assertIsNotNone(stored.get_profile(user["id"]))
                    finally:
                        stored.close()
                    with self.assertRaises(SystemExit) as failure:
                        bootstrap.main()
                    self.assertEqual(failure.exception.code, 1)
                    self.assertEqual(prompt.call_count, 2)
                finally:
                    get_settings.cache_clear()

    def test_identity_and_profile_persist_in_tinydb(self):
        reopened = IdentityStore(get_settings().db_path)
        try:
            self.assertEqual(reopened.get_user(self.user_uuid), self.user)
            self.assertEqual(reopened.get_profile(self.user_uuid)["user_id"], self.user_uuid)
            self.assertEqual(set(reopened.db.tables()), {"users", "profiles"})
        finally:
            reopened.close()

    def test_profile_model_persists_only_contact_and_identity(self):
        from app.models import Profile

        record = self.store.get_profile(self.user_uuid)
        profile = Profile.model_validate(record)
        self.assertEqual(str(profile.user_id), self.user_uuid)
        self.assertEqual(set(record), {"id", "user_id", "name", "contact_email", "phone", "address"})
        self.assertNotEqual(record["id"], self.user_uuid)
        self.assertEqual(profile.name, "")
        self.assertIsNone(profile.contact_email)
        self.assertIsNone(profile.phone)

    def test_profile_storage_rejects_credentials_and_invalid_contact(self):
        from pydantic import ValidationError

        invalid_fields = (
            {"email": "acceso@example.com"}, {"password": support.PASSWORD},
            {"hashed_password": "hash-no-permitido"}, {"role": "admin"},
            {"id": self.user_uuid}, {"user_uuid": self.user_uuid},
            {"contact_email": "no-es-un-email"}, {"display_name": "x" * 121},
            {"phone": "1" * 41},
        )
        original = self.store.get_profile(self.user_uuid)
        for fields in invalid_fields:
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                self.store.update_profile(self.user_uuid, fields)
        self.assertEqual(self.store.get_profile(self.user_uuid), original)
        self.store.delete_profile(self.user_uuid)
        for fields in invalid_fields:
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                self.store.create_profile(self.user_uuid, fields)
        self.assertIsNone(self.store.get_profile(self.user_uuid))

    def test_profile_cannot_be_orphaned_or_created_twice_concurrently(self):
        from uuid import uuid4

        with self.assertRaises(ValueError):
            self.store.create_profile(str(uuid4()), {})
        self.store.delete_profile(self.user_uuid)

        def create():
            try:
                self.store.create_profile(self.user_uuid, {})
                return True
            except ValueError:
                return False

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: create(), range(2)))
        self.assertEqual(sum(results), 1)
        self.assertEqual(len(self.store.profiles), 1)

    def test_concurrent_creation_cannot_duplicate_email(self):
        def create():
            try:
                self.store.create_user("concurrente@example.com", support.PASSWORD)
                return True
            except ValueError:
                return False

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: create(), range(2)))
        self.assertEqual(sum(results), 1)
        self.assertEqual(len(self.store.users), 2)
        self.assertEqual(len(self.store.profiles), 2)


class UserRestTests(support.ApiTestCase):
    def use_role(self, role):
        from tinydb import Query

        self.store.users.update({"role": role}, Query().id == self.user_uuid)
        return self.login_headers(self.user["email"])

    def test_registration_creates_initial_profile_without_mixing_credentials(self):
        from app.security import verify_password

        response = self.client.post("/users", headers=self.headers, json={
            "email": "registro@example.com", "password": support.PASSWORD,
            "name": "Persona ficticia", "phone": "+34 000000000", "address": "Dirección ficticia 1",
        })
        self.assertEqual(response.status_code, 201)
        user_uuid = response.json()["id"]
        user = self.store.get_user(user_uuid)
        profile = self.store.get_profile(user_uuid)
        self.assertTrue(verify_password(support.PASSWORD, user["hashed_password"]))
        self.assertEqual(user["role"], "user")
        self.assertEqual(profile["user_id"], user_uuid)
        self.assertEqual(profile["name"], "Persona ficticia")
        self.assertEqual(profile["phone"], "+34 000000000")
        self.assertEqual(profile["address"], "Dirección ficticia 1")
        for field in ("name", "display_name", "phone", "address"):
            self.assertNotIn(field, user)
        self.assertNotIn("hashed_password", response.json())
        self.assertNotIn(support.PASSWORD, response.text)

    def test_registration_rejects_invalid_profile_before_creating_any_record(self):
        before_users = len(self.store.users)
        before_profiles = len(self.store.profiles)
        for fields in ({"name": "x" * 121}, {"phone": "1" * 41}, {"address": "x" * 501}):
            with self.subTest(fields=fields):
                response = self.client.post("/users", headers=self.headers, json={
                    "email": "invalida@example.com", "password": support.PASSWORD, **fields,
                })
                self.assertEqual(response.status_code, 422)
        self.assertEqual(len(self.store.users), before_users)
        self.assertEqual(len(self.store.profiles), before_profiles)

    def test_registration_rolls_back_account_if_profile_creation_fails(self):
        with patch.object(self.store, "create_profile", side_effect=RuntimeError("Fallo simulado")):
            with self.assertRaises(RuntimeError):
                self.client.post("/users", headers=self.headers, json={
                    "email": "fallida@example.com", "password": support.PASSWORD, "name": "Prueba",
                })
        self.assertIsNone(self.store.find_user("fallida@example.com"))
        self.assertEqual(len(self.store.users), 1)
        self.assertEqual(len(self.store.profiles), 1)

    def test_directory_lists_all_accounts_and_reads_by_id_without_secrets(self):
        other = self.store.create_user("directorio@example.com", support.PASSWORD)
        for role in ("user", "manager", "admin"):
            headers = self.use_role(role)
            listed = self.client.get("/users", headers=headers)
            self.assertEqual(listed.status_code, 200)
            self.assertEqual({user["id"] for user in listed.json()}, {self.user_uuid, other["id"]})
            own = self.client.get(f"/users/{self.user_uuid}", headers=headers)
            self.assertEqual(own.status_code, 200)
            response = self.client.get(f"/users/{other['id']}", headers=headers)
            self.assertEqual(response.status_code, 200 if role == "admin" else 403)
            if role == "admin":
                self.assertEqual(response.json()["email"], other["email"])
            for user in listed.json() + [own.json()] + ([response.json()] if role == "admin" else []):
                self.assertEqual(set(user), {"id", "email", "role", "is_active", "created_at"})
                self.assertNotIn("hashed_password", user)
                self.assertNotIn("auth_version", user)
        self.assertEqual(self.client.get("/users/no-existe", headers=self.headers).status_code, 404)

    def test_put_allows_own_credentials_but_not_self_promotion(self):
        for role in ("user", "manager"):
            headers = self.use_role(role)
            own = self.client.put(f"/users/{self.user_uuid}", headers=headers,
                                   json={"email": self.user["email"]})
            self.assertEqual(own.status_code, 200)
            for requested_role in ("admin", "manager", "user"):
                promoted = self.client.put(f"/users/{self.user_uuid}", headers=headers,
                                           json={"role": requested_role})
                self.assertEqual(promoted.status_code, 403)
            self.assertEqual(self.store.get_user(self.user_uuid)["role"], role)

    def test_admin_can_update_other_credentials_and_role_and_revoke_old_tokens(self):
        headers = self.use_role("admin")
        other = self.store.create_user("gestionada@example.com", support.PASSWORD)
        old_headers = self.login_headers(other["email"])
        response = self.client.put(f"/users/{other['id']}", headers=headers,
                                   json={"email": "modificada@example.com", "role": "manager"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "modificada@example.com")
        self.assertEqual(response.json()["role"], "manager")
        self.assertEqual(self.store.get_user(other["id"])["role"], "manager")
        self.assertEqual(self.client.get("/users/me", headers=old_headers).status_code, 401)
        new_headers = self.login_headers("modificada@example.com")
        forbidden = self.client.put(f"/users/{self.user_uuid}", headers=new_headers,
                                    json={"role": "user"})
        self.assertEqual(forbidden.status_code, 403)

    def test_put_rejects_invalid_fields_roles_duplicates_and_missing_accounts(self):
        headers = self.use_role("admin")
        other = self.store.create_user("duplicada@example.com", support.PASSWORD)
        for fields in ({}, {"role": "owner"}, {"role": None}, {"email": None},
                       {"is_active": False}, {"name": "No es una credencial"}):
            with self.subTest(fields=fields):
                response = self.client.put(f"/users/{self.user_uuid}", headers=headers, json=fields)
                self.assertEqual(response.status_code, 422)
        duplicate = self.client.put(f"/users/{self.user_uuid}", headers=headers,
                                    json={"email": other["email"]})
        self.assertEqual(duplicate.status_code, 409)
        missing = self.client.put("/users/no-existe", headers=headers, json={"role": "user"})
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(self.store.get_user(self.user_uuid)["role"], "admin")

    def test_admin_delete_cascades_profile_summary_and_invalidates_session(self):
        from app.main import app

        headers = self.use_role("admin")
        other = self.store.create_user("eliminada@example.com", support.PASSWORD)
        other_headers = self.login_headers(other["email"])
        with app.state.summary_lock:
            app.state.summaries[other["id"]] = {"resultado": "ficticio"}
        deleted = self.client.delete(f"/users/{other['id']}", headers=headers)
        self.assertEqual(deleted.status_code, 204)
        self.assertIsNone(self.store.get_user(other["id"]))
        self.assertIsNone(self.store.get_profile(other["id"]))
        self.assertNotIn(other["id"], app.state.summaries)
        self.assertEqual(self.client.get("/users/me", headers=other_headers).status_code, 401)
        self.assertEqual(self.client.delete("/users/no-existe", headers=headers).status_code, 404)

    def test_user_and_manager_cannot_modify_or_delete_another_account(self):
        other = self.store.create_user("ajena@example.com", support.PASSWORD)
        for role in ("user", "manager"):
            headers = self.use_role(role)
            for method in ("PUT", "PATCH", "DELETE"):
                with self.subTest(role=role, method=method):
                    response = self.client.request(method, f"/users/{other['id']}", headers=headers,
                                                   json={"email": "no-autorizada@example.com"})
                    self.assertEqual(response.status_code, 403)
        self.assertEqual(self.store.get_user(other["id"]), other)
        self.assertIsNotNone(self.store.get_profile(other["id"]))

    def test_admin_registration_still_defaults_to_user_role(self):
        headers = self.use_role("admin")
        response = self.client.post("/users", headers=headers, json={
            "email": "nueva-interna@example.com", "password": support.PASSWORD,
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["role"], "user")
        self.assertEqual(self.store.get_user(response.json()["id"])["role"], "user")

    def test_cors_allows_authorization_and_management_methods(self):
        response = self.client.options("/users/me", headers={
            "Origin": "http://localhost:3000", "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("Authorization", response.headers["access-control-allow-headers"])


class ProfileMeTests(support.ApiTestCase):
    def test_get_me_returns_the_stored_profile_with_canonical_fields(self):
        response = self.client.get("/profiles/me", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), self.store.get_profile(self.user_uuid))
        self.assertEqual(set(response.json()), {"id", "user_id", "name", "phone", "address", "contact_email"})
        self.assertEqual(response.json()["user_id"], self.user_uuid)
        self.assertNotIn("user_uuid", response.json())
        self.assertNotIn("display_name", response.json())
        self.assertNotIn("email", response.json())
        self.assertNotIn("hashed_password", response.json())
        raw = self.store.profiles.all()[0]
        self.assertEqual(raw["user_id"], self.user_uuid)
        self.assertNotIn("user_uuid", raw)

    def test_put_me_updates_contact_and_persists_without_changing_user(self):
        original = self.store.get_profile(self.user_uuid)
        fields = {"name": "Persona ficticia", "phone": "+34 000000000", "address": "Dirección ficticia"}
        response = self.client.put("/profiles/me", headers=self.headers, json=fields)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {**original, **fields})
        reopened = IdentityStore(get_settings().db_path)
        try:
            self.assertEqual(reopened.get_profile(self.user_uuid), response.json())
        finally:
            reopened.close()
        self.assertEqual(self.store.get_user(self.user_uuid), self.user)

    def test_put_me_partial_update_preserves_name_and_can_clear_optional_contact(self):
        self.store.update_profile(self.user_uuid, {"name": "Nombre conservado", "phone": "000", "address": "Ejemplo"})
        response = self.client.put("/profiles/me", headers=self.headers, json={"phone": None, "address": None})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Nombre conservado")
        self.assertIsNone(response.json()["phone"])
        self.assertIsNone(response.json()["address"])

    def test_me_routes_require_valid_authentication(self):
        for headers in ({}, {"Authorization": "Bearer no-valido"}):
            for method in ("GET", "PUT"):
                with self.subTest(method=method, headers=headers):
                    response = self.client.request(method, "/profiles/me", headers=headers, json={"name": "Prueba"})
                    self.assertEqual(response.status_code, 401)
                    self.assertEqual(response.headers["www-authenticate"], "Bearer")

    def test_put_me_rejects_identity_credentials_and_fields_outside_contact(self):
        original = self.store.get_profile(self.user_uuid)
        for fields in (
            {"id": self.user_uuid}, {"user_id": self.user_uuid}, {"user_uuid": self.user_uuid},
            {"role": "admin"}, {"email": "acceso@example.com"}, {"password": support.PASSWORD},
            {"hashed_password": "no-permitido"}, {"contact_email": "contacto@example.com"},
            {"display_name": "Nombre antiguo"},
        ):
            with self.subTest(fields=fields):
                response = self.client.put("/profiles/me", headers=self.headers, json=fields)
                self.assertEqual(response.status_code, 422)
                self.assertNotIn(support.PASSWORD, response.text)
        self.assertEqual(self.store.get_profile(self.user_uuid), original)

    def test_put_me_rejects_invalid_values_before_writing(self):
        original = self.store.get_profile(self.user_uuid)
        for fields in ({}, {"name": None}, {"name": "x" * 121}, {"phone": "1" * 41}, {"address": "x" * 501}):
            with self.subTest(fields=fields):
                response = self.client.put("/profiles/me", headers=self.headers, json=fields)
                self.assertEqual(response.status_code, 422)
        self.assertEqual(self.store.get_profile(self.user_uuid), original)

    def test_me_uses_token_owner_and_admin_cannot_modify_another_profile(self):
        from tinydb import Query

        other = self.store.create_user("otro-perfil@example.com", support.PASSWORD)
        other_headers = self.login_headers(other["email"])
        other_profile = self.store.get_profile(other["id"])
        self.store.users.update({"role": "admin"}, Query().id == self.user_uuid)
        response = self.client.put("/profiles/me", headers=self.headers, json={"name": "Perfil del admin"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user_id"], self.user_uuid)
        self.assertEqual(self.store.get_profile(other["id"]), other_profile)
        denied = self.client.patch(f"/profiles/{other['id']}", headers=self.headers, json={"name": "Ajeno"})
        self.assertEqual(denied.status_code, 403)
        own = self.client.put("/profiles/me", headers=other_headers, json={"name": "Perfil del otro usuario"})
        self.assertEqual(own.status_code, 200)
        self.assertEqual(own.json()["user_id"], other["id"])
        self.assertEqual(self.store.get_profile(self.user_uuid)["name"], "Perfil del admin")

    def test_me_missing_profile_returns_404_without_creating_one(self):
        self.store.delete_profile(self.user_uuid)
        for method in ("GET", "PUT"):
            response = self.client.request(method, "/profiles/me", headers=self.headers, json={"name": "Prueba"})
            self.assertEqual(response.status_code, 404)
        self.assertIsNone(self.store.get_profile(self.user_uuid))

    def test_legacy_profile_can_be_read_without_rewrite_and_updated_explicitly(self):
        original = self.store.get_profile(self.user_uuid)
        self.store.delete_profile(self.user_uuid)
        legacy = {**original, "user_uuid": original["user_id"], "display_name": "Nombre histórico"}
        legacy.pop("user_id")
        legacy.pop("name")
        self.store.profiles.insert(legacy)
        response = self.client.get("/profiles/me", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Nombre histórico")
        self.assertEqual(response.json()["user_id"], self.user_uuid)
        self.assertEqual(dict(self.store.profiles.all()[0]), legacy)
        with self.assertRaises(ValueError):
            self.store.create_profile(self.user_uuid, {})
        updated = self.client.put("/profiles/me", headers=self.headers, json={"address": "Nueva dirección ficticia"})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["name"], "Nombre histórico")
        raw = self.store.profiles.all()[0]
        self.assertEqual(raw["id"], original["id"])
        self.assertEqual(raw["user_id"], self.user_uuid)
        self.assertNotIn("user_uuid", raw)
        self.assertNotIn("display_name", raw)

    def test_delete_user_cascades_to_legacy_profile(self):
        original = self.store.get_profile(self.user_uuid)
        self.store.delete_profile(self.user_uuid)
        legacy = {**original, "user_uuid": original["user_id"], "display_name": original["name"]}
        legacy.pop("user_id")
        legacy.pop("name")
        self.store.profiles.insert(legacy)
        response = self.client.delete(f"/users/{self.user_uuid}", headers=self.headers)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(len(self.store.profiles), 0)


class UserServiceTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.store = IdentityStore(str(Path(temporary.name) / "identity.json"))
        self.addCleanup(self.store.close)

    def test_user_lifecycle_without_http(self):
        from app.security import verify_password

        created = user_service.create_user(self.store, "SERVICIO@example.com", support.PASSWORD)
        user_uuid = created["id"]
        self.assertEqual(created["email"], "servicio@example.com")
        self.assertEqual(created["role"], "user")
        self.assertTrue(verify_password(support.PASSWORD, created["hashed_password"]))
        self.assertEqual(user_service.get_user_by_id(self.store, user_uuid), created)
        self.assertEqual(user_service.get_user_by_email(self.store, " SERVICIO@example.com "), created)
        self.assertIsNotNone(self.store.get_profile(user_uuid))

        changes = {"email": "CAMBIADA@example.com", "password": "nueva-contraseña-de-servicio"}
        updated = user_service.update_user(self.store, user_uuid, changes)
        self.assertEqual(updated["email"], "cambiada@example.com")
        self.assertEqual(updated["id"], user_uuid)
        self.assertEqual(updated["created_at"], created["created_at"])
        self.assertNotEqual(updated["auth_version"], created["auth_version"])
        self.assertTrue(verify_password(changes["password"], updated["hashed_password"]))
        self.assertIsNone(user_service.get_user_by_email(self.store, created["email"]))
        self.assertEqual(changes["email"], "CAMBIADA@example.com")
        self.assertNotIn("password", updated)

        user_service.delete_user(self.store, user_uuid)
        self.assertIsNone(user_service.get_user_by_id(self.store, user_uuid))
        self.assertIsNone(user_service.get_user_by_email(self.store, updated["email"]))
        self.assertIsNone(self.store.get_profile(user_uuid))

    def test_missing_users_return_none_or_raise_explicit_error(self):
        self.assertIsNone(user_service.get_user_by_id(self.store, "inexistente"))
        self.assertIsNone(user_service.get_user_by_email(self.store, "ausente@example.com"))
        with self.assertRaises(user_service.UserNotFoundError):
            user_service.update_user(self.store, "inexistente", {"email": "nueva@example.com"})
        with self.assertRaises(user_service.UserNotFoundError):
            user_service.delete_user(self.store, "inexistente")
        self.assertEqual(len(self.store.users), 0)

    def test_service_validates_credentials_before_writing(self):
        from pydantic import ValidationError

        for email, password in (("invalido", support.PASSWORD), ("valida@example.com", "corta")):
            with self.subTest(email=email), self.assertRaises(ValidationError):
                user_service.create_user(self.store, email, password)
        self.assertEqual(len(self.store.users), 0)
        self.assertEqual(len(self.store.profiles), 0)

        created = user_service.create_user(self.store, "servicio@example.com", support.PASSWORD)
        for changes in ({}, {"email": None}, {"password": "corta"}, {"role": "admin"}, {"is_active": False}):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                user_service.update_user(self.store, created["id"], changes)
        self.assertEqual(user_service.get_user_by_id(self.store, created["id"]), created)

    def test_service_preserves_email_uniqueness(self):
        first = user_service.create_user(self.store, "primera@example.com", support.PASSWORD)
        second = user_service.create_user(self.store, "segunda@example.com", support.PASSWORD)
        with self.assertRaises(ValueError):
            user_service.create_user(self.store, "PRIMERA@example.com", support.PASSWORD)
        with self.assertRaises(ValueError):
            user_service.update_user(self.store, second["id"], {"email": first["email"]})
        self.assertEqual(user_service.get_user_by_id(self.store, second["id"]), second)
        self.assertEqual(len(self.store.users), 2)
        self.assertEqual(len(self.store.profiles), 2)