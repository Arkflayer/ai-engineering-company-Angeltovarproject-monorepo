import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.security import (
    create_access_token,
    decode_access_token,
    get_settings,
    hash_password,
    verify_password,
)


class SecurityTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {
            "TRACKFLOW_JWT_SECRET": "s" * 48,
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        })
        self.environment.start()
        get_settings.cache_clear()
        self.addCleanup(self.environment.stop)
        self.addCleanup(get_settings.cache_clear)

    def test_password_is_salted_and_verified_as_hash(self):
        password = "contraseña-de-prueba-segura"
        hashed = hash_password(password)
        self.assertTrue(hashed.startswith(("$2a$", "$2b$", "$2y$")))
        self.assertNotEqual(hashed, password)
        self.assertNotEqual(hashed, hash_password(password))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("incorrecta", hashed))

    def test_bcrypt_rejects_passwords_over_72_utf8_bytes_without_truncation(self):
        password = "á" * 37
        self.assertGreater(len(password.encode("utf-8")), 72)
        with self.assertRaises(ValueError):
            hash_password(password)
        self.assertFalse(verify_password(password, bcrypt.hash("á" * 36)))

    def test_legacy_bcrypt_sha256_hashes_remain_verifiable(self):
        password = "contraseña-antigua-segura"
        old_hash = CryptContext(schemes=["bcrypt_sha256"]).hash(password)
        self.assertTrue(verify_password(password, old_hash))
        self.assertFalse(verify_password("incorrecta", old_hash))

    def test_token_contains_identity_and_configurable_expiration(self):
        with patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": "7"}):
            get_settings.cache_clear()
            claims = decode_access_token(create_access_token("usuario-id", "version"))
        self.assertEqual(claims["sub"], "usuario-id")
        self.assertEqual(claims["ver"], "version")
        self.assertEqual(claims["exp"] - claims["iat"], 7 * 60)

    def test_expired_unsigned_and_wrongly_signed_tokens_are_rejected(self):
        now = datetime.now(timezone.utc)
        claims = {"sub": "usuario", "iat": now, "exp": now - timedelta(seconds=1)}
        expired = jwt.encode(claims, "s" * 48, algorithm="HS256")
        claims["exp"] = now + timedelta(minutes=1)
        forged = jwt.encode(claims, "otra-clave" * 8, algorithm="HS256")
        for token in (expired, forged, "eyJhbGciOiJub25lIn0.e30."):
            with self.subTest(token=token), self.assertRaises(JWTError):
                decode_access_token(token)

    def test_secret_and_expiration_configuration_fail_closed(self):
        for values in (
            {"TRACKFLOW_JWT_SECRET": ""},
            {"TRACKFLOW_JWT_SECRET": "corta"},
            {"ACCESS_TOKEN_EXPIRE_MINUTES": ""},
            {"ACCESS_TOKEN_EXPIRE_MINUTES": "0"},
            {"ACCESS_TOKEN_EXPIRE_MINUTES": "no-numérico"},
        ):
            with self.subTest(values=values), patch.dict(os.environ, values):
                get_settings.cache_clear()
                with self.assertRaises(RuntimeError):
                    get_settings()

    def test_expiration_is_read_from_required_environment_variable(self):
        with patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": "9"}):
            get_settings.cache_clear()
            self.assertEqual(get_settings().token_minutes, 9)

    def test_dotenv_template_has_no_real_secret(self):
        template = Path(__file__).resolve().parents[1] / ".env.example"
        values = {}
        for line in template.read_text(encoding="utf-8").splitlines():
            key, value = line.split("=", maxsplit=1)
            values[key] = value
        self.assertEqual(values["ACCESS_TOKEN_EXPIRE_MINUTES"], "30")
        self.assertIn("replace-with-", values["TRACKFLOW_JWT_SECRET"])

    def test_default_database_is_outside_the_static_monorepo(self):
        with patch.dict(os.environ):
            os.environ.pop("TRACKFLOW_DB_PATH", None)
            get_settings.cache_clear()
            location = Path(get_settings().db_path).resolve()
        repository = Path(__file__).resolve().parents[3]
        self.assertFalse(location.is_relative_to(repository))