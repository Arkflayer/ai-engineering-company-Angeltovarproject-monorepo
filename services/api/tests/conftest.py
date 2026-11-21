from __future__ import annotations

from pathlib import Path

import pytest

from app.security import get_settings
from app.storage import IdentityStore


@pytest.fixture
def identity_store(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> IdentityStore:
    monkeypatch.setenv("TRACKFLOW_JWT_SECRET", "pytest-only-secret-with-at-least-32-bytes")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("TRACKFLOW_DB_PATH", str(tmp_path / "identity.json"))
    monkeypatch.setenv("TRACKFLOW_SUPPLIER_DB_PATH", str(tmp_path / "suppliers.json"))
    get_settings.cache_clear()
    store = IdentityStore(str(tmp_path / "identity.json"))
    yield store
    store.close()
    get_settings.cache_clear()


@pytest.fixture
def registered_user(identity_store: IdentityStore) -> dict:
    return identity_store.create_user(
        "test.user@example.com",
        "valid-password-123",
        profile_fields={"name": "Test User", "phone": "+1-555-0100"},
    )
