import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import app
from app.security import get_settings

PASSWORD = "contraseña-segura-de-prueba"


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        environment = patch.dict(os.environ, {
            "TRACKFLOW_JWT_SECRET": "clave-solo-para-pruebas-" * 3,
            "TRACKFLOW_DB_PATH": str(Path(temporary.name) / "identity.json"),
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        })
        environment.start()
        self.addCleanup(environment.stop)
        get_settings.cache_clear()
        self.addCleanup(get_settings.cache_clear)
        self.client = TestClient(app)
        self.client.__enter__()
        self.addCleanup(self.client.__exit__, None, None, None)
        self.store = app.state.identity
        self.user = self.store.create_user("persona@example.com", PASSWORD)
        self.user_uuid = self.user["id"]
        self.headers = self.login_headers("persona@example.com")

    def login_headers(self, email, password=PASSWORD):
        response = self.client.post("/auth/login", data={"username": email, "password": password})
        self.assertEqual(response.status_code, 200, response.text)
        return {"Authorization": f"Bearer {response.json()['access_token']}"}