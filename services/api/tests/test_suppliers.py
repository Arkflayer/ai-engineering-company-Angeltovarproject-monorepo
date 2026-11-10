import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from pydantic import ValidationError

from support import ApiTestCase
from app.domains.suppliers.models import SupplierCreate, SupplierRateUpdate, SupplierStatusUpdate
from app.domains.suppliers.storage import SupplierStore


class SupplierModelTests(unittest.TestCase):
    def setUp(self):
        self.valid = {
            "name": "Proveedor de prueba",
            "country": "USA",
            "categories": ["carrier_last_mile"],
            "rate_per_shipment": 1.25,
            "currency": "USD",
            "status": "active",
        }

    def test_rejects_invalid_business_values(self):
        for changes in (
            {"rate_per_shipment": 0},
            {"rate_per_shipment": -1},
            {"status": "paused"},
            {"country": "USA", "currency": "EUR"},
            {"categories": []},
            {"updated_at": "2026-01-01T00:00:00Z"},
        ):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                SupplierCreate.model_validate({**self.valid, **changes})

    def test_rate_and_status_patch_models_are_restricted(self):
        with self.assertRaises(ValidationError):
            SupplierRateUpdate(rate_per_shipment=0)
        with self.assertRaises(ValidationError):
            SupplierStatusUpdate(status="paused")


class SupplierStoreTests(unittest.TestCase):
    def test_create_update_and_seed_are_persistent_and_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / "suppliers.json")
            store = SupplierStore(path)
            supplier = SupplierCreate(
                name="Proveedor de prueba", country="USA", categories=["carrier_last_mile"],
                rate_per_shipment=1.25, currency="USD", status="active",
            )
            created = store.create(supplier)
            self.assertEqual(created["id"], 1)
            first_updated_at = created["updated_at"]
            changed = store.update_rate(created["id"], 2.5)
            self.assertEqual(changed["rate_per_shipment"], 2.5)
            self.assertGreater(datetime.fromisoformat(changed["updated_at"]), datetime.fromisoformat(first_updated_at))
            rate_updated_at = changed["updated_at"]
            status_changed = store.update_status(created["id"], "suspended")
            self.assertEqual(status_changed["updated_at"], rate_updated_at)
            history = store.get_status_history(created["id"])
            self.assertEqual(len(history), 1)
            self.assertEqual(history[0]["previous_status"], "active")
            self.assertEqual(history[0]["status"], "suspended")
            unchanged_status = store.update_status(created["id"], "suspended")
            self.assertEqual(unchanged_status["updated_at"], rate_updated_at)
            self.assertEqual(len(store.get_status_history(created["id"])), 1)
            self.assertEqual(store.seed([supplier]), 0)
            seeded_supplier = SupplierCreate(**{**supplier.model_dump(), "name": "Proveedor de seed"})
            self.assertEqual(store.seed([seeded_supplier]), 1)
            self.assertEqual(store.seed([seeded_supplier]), 0)
            store.db.close()
            reopened = SupplierStore(path)
            try:
                self.assertEqual(reopened.get(created["id"])["rate_per_shipment"], 2.5)
                self.assertEqual(len(reopened.get_status_history(created["id"])), 1)
            finally:
                reopened.close()


class SupplierApiTests(ApiTestCase):
    def test_supplier_crud_filter_validation_and_authentication(self):
        unauthenticated = self.client.get("/suppliers")
        self.assertEqual(unauthenticated.status_code, 401)

        invalid = self.client.post(
            "/suppliers", headers=self.headers,
            json={
                "name": "Tasa inválida", "country": "USA", "categories": ["carrier_last_mile"],
                "rate_per_shipment": 0, "currency": "USD", "status": "active",
            },
        )
        self.assertEqual(invalid.status_code, 422)

        created = self.client.post(
            "/suppliers", headers=self.headers,
            json={
                "name": "Proveedor API", "country": "USA", "categories": ["carrier_last_mile"],
                "rate_per_shipment": 1.5, "currency": "USD", "status": "active",
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        supplier = created.json()
        self.assertTrue(supplier["id"] > 0)
        self.assertIn("updated_at", supplier)
        self.assertEqual(self.client.get("/suppliers?country=Spain", headers=self.headers).json(), [])
        self.assertEqual(len(self.client.get("/suppliers?category=carrier_last_mile", headers=self.headers).json()), 1)

        updated_rate = self.client.patch(
            f"/suppliers/{supplier['id']}/rate", headers=self.headers,
            json={"rate_per_shipment": 2.25},
        )
        self.assertEqual(updated_rate.status_code, 200)
        self.assertEqual(updated_rate.json()["rate_per_shipment"], 2.25)
        updated_status = self.client.patch(
            f"/suppliers/{supplier['id']}/status", headers=self.headers,
            json={"status": "suspended"},
        )
        self.assertEqual(updated_status.status_code, 200)
        self.assertEqual(updated_status.json()["status"], "suspended")
        self.assertEqual(updated_status.json()["updated_at"], updated_rate.json()["updated_at"])
        status_history = self.client.get(f"/suppliers/{supplier['id']}/status-history", headers=self.headers)
        self.assertEqual(status_history.status_code, 200)
        self.assertEqual(status_history.json()[0]["previous_status"], "active")
        self.assertEqual(status_history.json()[0]["status"], "suspended")
        self.assertEqual(self.client.get("/suppliers/999999", headers=self.headers).status_code, 404)
        self.assertEqual(self.client.delete(f"/suppliers/{supplier['id']}", headers=self.headers).status_code, 204)
        self.assertEqual(self.client.delete(f"/suppliers/{supplier['id']}", headers=self.headers).status_code, 404)


if __name__ == "__main__":
    unittest.main()
