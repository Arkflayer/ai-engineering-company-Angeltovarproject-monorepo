"""Tests for the TinyDB-based incident storage layer."""
from __future__ import annotations

import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from app.domains.incidents.models import (
    IncidentBranch,
    IncidentCategory,
    IncidentCreate,
    IncidentStatus,
    IncidentUpdate,
)
from app.domains.incidents.storage import IncidentStore


class IncidentStoreTests(unittest.TestCase):
    """Validates CRUD, filtering, seeding, and summary logic."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = str(Path(self.tmp.name) / "incidents.json")
        self.store = IncidentStore(self.path)
        self.addCleanup(self.store.close)

        self.valid_payload = IncidentCreate(
            title="Paquete perdido en LA",
            description="El cliente reporta que no llegó su pedido.",
            category=IncidentCategory.LOST_PARCEL,
            origin="customer",
            branch=IncidentBranch.LA_OFFICE,
            country="US",
            customer_type="B2C",
            tracking_number="TRACK000123",
            carrier="UPS",
            customer_email="cliente@example.com",
        )

    # ── Create ─────────────────────────────────────────────────────────

    def test_create_returns_incident_with_id(self):
        result = self.store.create(self.valid_payload, reported_by="system")
        self.assertIn("id", result)
        self.assertEqual(len(result["id"]), 36)
        self.assertEqual(result["title"], "Paquete perdido en LA")
        self.assertEqual(result["status"], "open")
        self.assertEqual(result["reported_by"], "system")

    def test_create_sets_timestamps(self):
        result = self.store.create(self.valid_payload)
        self.assertIn("created_at", result)
        self.assertIn("updated_at", result)
        # Both timestamps should be ISO-formatted and valid
        self.assertGreater(len(result["created_at"]), 10)
        self.assertGreater(len(result["updated_at"]), 10)

    # ── Get ────────────────────────────────────────────────────────────

    def test_get_existing_incident(self):
        created = self.store.create(self.valid_payload)
        fetched = self.store.get(created["id"])
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["id"], created["id"])

    def test_get_nonexistent_returns_none(self):
        self.assertIsNone(self.store.get("nonexistent-id"))

    # ── List ───────────────────────────────────────────────────────────

    def test_list_returns_all(self):
        self.store.create(self.valid_payload)
        self.store.create(
            IncidentCreate(
                title="Segunda incidencia",
                description="Descripción de la segunda incidencia",
                category=IncidentCategory.DELIVERY_FAILURE,
                branch=IncidentBranch.ZARAGOZA_OFFICE,
                country="ES",
            )
        )
        items = self.store.list()
        self.assertEqual(len(items), 2)

    def test_list_filters_by_status(self):
        self.store.create(self.valid_payload)
        items = self.store.list(status=IncidentStatus.OPEN)
        self.assertEqual(len(items), 1)
        items = self.store.list(status=IncidentStatus.RESOLVED)
        self.assertEqual(len(items), 0)

    def test_list_filters_by_category(self):
        self.store.create(self.valid_payload)
        items = self.store.list(category=IncidentCategory.LOST_PARCEL)
        self.assertEqual(len(items), 1)
        items = self.store.list(category=IncidentCategory.CARRIER_ISSUE)
        self.assertEqual(len(items), 0)

    def test_list_filters_by_country(self):
        self.store.create(self.valid_payload)
        items = self.store.list(country="US")
        self.assertEqual(len(items), 1)
        items = self.store.list(country="ES")
        self.assertEqual(len(items), 0)

    def test_list_filters_by_branch(self):
        self.store.create(self.valid_payload)
        items = self.store.list(branch=IncidentBranch.LA_OFFICE)
        self.assertEqual(len(items), 1)
        items = self.store.list(branch=IncidentBranch.ZARAGOZA_OFFICE)
        self.assertEqual(len(items), 0)

    def test_list_combines_filters(self):
        self.store.create(self.valid_payload)
        items = self.store.list(status=IncidentStatus.OPEN, country="US")
        self.assertEqual(len(items), 1)
        items = self.store.list(status=IncidentStatus.RESOLVED, country="US")
        self.assertEqual(len(items), 0)

    # ── Update ─────────────────────────────────────────────────────────

    def test_update_changes_status(self):
        created = self.store.create(self.valid_payload)
        updated = self.store.update(
            created["id"],
            IncidentUpdate(status=IncidentStatus.IN_PROGRESS),
        )
        self.assertEqual(updated["status"], "in_progress")

    def test_update_rejects_invalid_transition(self):
        created = self.store.create(self.valid_payload)
        with self.assertRaises(ValueError):
            self.store.update(
                created["id"],
                IncidentUpdate(status=IncidentStatus.RESOLVED),  # open → resolved not allowed
            )

    def test_update_resolved_allows_score(self):
        created = self.store.create(self.valid_payload)
        # Move to in_progress first
        self.store.update(created["id"], IncidentUpdate(status=IncidentStatus.IN_PROGRESS))
        # Then to resolved with score
        updated = self.store.update(
            created["id"],
            IncidentUpdate(status=IncidentStatus.RESOLVED, satisfaction_score=4),
        )
        self.assertEqual(updated["status"], "resolved")
        self.assertEqual(updated["satisfaction_score"], 4)

    def test_update_score_requires_resolved_at_that_moment(self):
        created = self.store.create(self.valid_payload)
        with self.assertRaises(ValueError):
            self.store.update(
                created["id"],
                IncidentUpdate(satisfaction_score=4),  # still "open"
            )

    def test_update_description(self):
        created = self.store.create(self.valid_payload)
        updated = self.store.update(
            created["id"],
            IncidentUpdate(description="Nueva descripción"),
        )
        self.assertEqual(updated["description"], "Nueva descripción")

    def test_update_nonexistent_returns_none(self):
        self.assertIsNone(self.store.update("bogus", IncidentUpdate()))

    def test_update_updates_timestamp(self):
        created = self.store.create(self.valid_payload)
        updated = self.store.update(
            created["id"],
            IncidentUpdate(status=IncidentStatus.IN_PROGRESS),
        )
        self.assertGreater(updated["updated_at"], created["updated_at"])

    # ── Delete ─────────────────────────────────────────────────────────

    def test_delete_returns_true_for_existing(self):
        created = self.store.create(self.valid_payload)
        self.assertTrue(self.store.delete(created["id"]))

    def test_delete_removes_incident(self):
        created = self.store.create(self.valid_payload)
        self.store.delete(created["id"])
        self.assertIsNone(self.store.get(created["id"]))

    def test_delete_nonexistent_returns_false(self):
        self.assertFalse(self.store.delete("bogus-id"))

    # ── Summary ────────────────────────────────────────────────────────

    def test_summary_empty(self):
        s = self.store.summary()
        self.assertEqual(s["total"], 0)
        self.assertEqual(s["by_status"], {})
        self.assertEqual(s["by_category"], {})
        self.assertEqual(s["by_branch"], {})

    def test_summary_counts(self):
        self.store.create(
            IncidentCreate(
                title="Inc 1", description="Descripción inc 1", category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE, country="US",
            )
        )
        self.store.create(
            IncidentCreate(
                title="Inc 2", description="Descripción inc 2", category=IncidentCategory.CARRIER_ISSUE,
                branch=IncidentBranch.ZARAGOZA_OFFICE, country="ES",
            )
        )
        s = self.store.summary()
        self.assertEqual(s["total"], 2)
        self.assertEqual(s["by_status"].get("open"), 2)
        self.assertEqual(s["by_category"].get("lost_parcel"), 1)
        self.assertEqual(s["by_category"].get("carrier_issue"), 1)
        self.assertEqual(s["by_branch"].get("la_office"), 1)
        self.assertEqual(s["by_branch"].get("zaragoza_office"), 1)

    # ── Seed ───────────────────────────────────────────────────────────

    def test_seed_inserts_new_records(self):
        payloads = [
            {
                "id": "TRF-000001", "title": "Inc 1", "description": "Incident description",
                "status": "open", "category": "lost_parcel", "origin": "customer",
                "branch": "la_office", "country": "US", "customer_type": "B2B",
                "tracking_number": "TRK001", "carrier": "UPS",
                "customer_email": "a@b.com", "satisfaction_score": None,
                "reported_by": "system", "created_at": "now", "updated_at": "now",
            },
        ]
        inserted = self.store.seed(payloads)
        self.assertEqual(inserted, 1)
        self.assertIsNotNone(self.store.get("TRF-000001"))

    def test_seed_is_idempotent(self):
        payloads = [
            {
                "id": "TRF-000001", "title": "Inc 1", "description": "Incident description",
                "status": "open", "category": "lost_parcel", "origin": "customer",
                "branch": "la_office", "country": "US", "customer_type": "B2B",
                "tracking_number": "TRK001", "carrier": "UPS",
                "customer_email": "a@b.com", "satisfaction_score": None,
                "reported_by": "system", "created_at": "now", "updated_at": "now",
            },
        ]
        self.store.seed(payloads)
        inserted = self.store.seed(payloads)
        self.assertEqual(inserted, 0)


if __name__ == "__main__":
    unittest.main()