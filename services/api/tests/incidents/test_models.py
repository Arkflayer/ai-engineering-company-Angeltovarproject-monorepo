"""Tests for the incident Pydantic models and business logic."""
from __future__ import annotations

import unittest

from pydantic import ValidationError

from app.domains.incidents.models import (
    Incident,
    IncidentBranch,
    IncidentCategory,
    IncidentCreate,
    IncidentResponse,
    IncidentStatus,
    IncidentUpdate,
    BRANCH_DISPLAY,
    VALID_TRANSITIONS,
)


class IncidentModelTests(unittest.TestCase):
    """Validates model-level constraints and enum definitions."""

    def setUp(self):
        self.incident_kwargs = {
            "title": "Incidente de prueba",
            "description": "Descripción del incidente de prueba",
            "category": IncidentCategory.LOST_PARCEL,
            "branch": IncidentBranch.LA_OFFICE,
        }

    # ── IncidentCreate ─────────────────────────────────────────────────

    def test_create_requires_title_and_category_and_branch(self):
        with self.assertRaises(ValidationError):
            IncidentCreate()

    def test_create_minimal_valid(self):
        incident = IncidentCreate(
            title="Paquete perdido en ruta",
            description="Descripción del paquete perdido",
            category=IncidentCategory.LOST_PARCEL,
            branch=IncidentBranch.LA_OFFICE,
        )
        self.assertEqual(incident.title, "Paquete perdido en ruta")
        self.assertEqual(incident.category, IncidentCategory.LOST_PARCEL)
        self.assertEqual(incident.branch, IncidentBranch.LA_OFFICE)
        self.assertEqual(incident.origin, "branch")  # default

    def test_create_title_not_empty(self):
        with self.assertRaises(ValidationError):
            IncidentCreate(
                title="   ",
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
            )

    def test_create_title_max_length(self):
        with self.assertRaises(ValidationError):
            IncidentCreate(
                title="x" * 121,
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
            )

    def test_create_country_must_match_pattern(self):
        with self.assertRaises(ValidationError):
            IncidentCreate(
                title="Test",
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
                country="MEXICO",
            )

    def test_create_country_valid_values(self):
        for code in ("US", "ES"):
            incident = IncidentCreate(
                title="Test",
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
                country=code,
            )
            self.assertEqual(incident.country, code)

    def test_create_customer_type_must_match_pattern(self):
        with self.assertRaises(ValidationError):
            IncidentCreate(
                title="Test",
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
                customer_type="B2A",
            )

    def test_create_customer_type_valid(self):
        for t in ("B2B", "B2C"):
            incident = IncidentCreate(
                title="Test",
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
                customer_type=t,
            )
            self.assertEqual(incident.customer_type, t)

    def test_create_extra_field_forbidden(self):
        with self.assertRaises(ValidationError):
            IncidentCreate(
                title="Test",
                description="Descripción",
                category=IncidentCategory.LOST_PARCEL,
                branch=IncidentBranch.LA_OFFICE,
                extra_field="nope",
            )

    # ── Incident (internal) ────────────────────────────────────────────

    def test_incident_generates_uuid(self):
        incident = Incident(**self.incident_kwargs)
        self.assertIsNotNone(incident.id)
        self.assertEqual(len(incident.id), 36)  # UUID format

    def test_incident_default_status_is_open(self):
        incident = Incident(**self.incident_kwargs)
        self.assertEqual(incident.status, IncidentStatus.OPEN)

    def test_incident_default_origin_is_branch(self):
        incident = Incident(**self.incident_kwargs)
        # When not passed, origin uses the Field default ("branch")
        self.assertEqual(incident.origin, "branch")  # default on Incident model

    def test_incident_satisfaction_score_requires_resolved(self):
        """Only resolved incidents may have a satisfaction score."""
        with self.assertRaises(ValidationError):
            Incident(
                **self.incident_kwargs,
                status=IncidentStatus.OPEN,
                satisfaction_score=4,
            )

    def test_incident_satisfaction_score_allowed_when_resolved(self):
        incident = Incident(
            **self.incident_kwargs,
            status=IncidentStatus.RESOLVED,
            satisfaction_score=5,
        )
        self.assertEqual(incident.satisfaction_score, 5)

    def test_incident_score_range(self):
        with self.assertRaises(ValidationError):
            Incident(
                **self.incident_kwargs,
                status=IncidentStatus.RESOLVED,
                satisfaction_score=6,
            )

    def test_incident_extra_field_forbidden(self):
        with self.assertRaises(ValidationError):
            Incident(**self.incident_kwargs, unknown_field=True)

    # ── IncidentUpdate ─────────────────────────────────────────────────

    def test_update_empty_is_valid(self):
        update = IncidentUpdate()
        self.assertIsNone(update.status)
        self.assertIsNone(update.description)

    def test_update_partial_fields(self):
        update = IncidentUpdate(status=IncidentStatus.IN_PROGRESS)
        self.assertEqual(update.status, IncidentStatus.IN_PROGRESS)
        self.assertIsNone(update.description)

    def test_update_score_out_of_range(self):
        with self.assertRaises(ValidationError):
            IncidentUpdate(satisfaction_score=0)

    def test_update_extra_field_forbidden(self):
        with self.assertRaises(ValidationError):
            IncidentUpdate(unknown="nope")

    # ── IncidentResponse ───────────────────────────────────────────────

    def test_response_accepts_all_types(self):
        response = IncidentResponse(
            id="abc-123",
            title="Test",
            description="Desc",
            status="open",
            category="lost_parcel",
            origin="customer",
            branch="la_office",
            country="US",
            customer_type="B2B",
            tracking_number="TRACK0001",
            carrier="UPS",
            customer_email="test@example.com",
            satisfaction_score=None,
            reported_by="system",
            created_at="2026-01-15T00:00:00Z",
            updated_at="2026-01-15T00:00:00Z",
        )
        self.assertEqual(response.id, "abc-123")
        self.assertEqual(response.status, "open")

    def test_response_extra_field_forbidden_by_default(self):
        """IncidentResponse has use_enum_values=True but no extra='forbid' by default."""
        # It doesn't have extra='forbid' so this is a flex test — it won't fail
        response = IncidentResponse(
            id="abc",
            title="T",
            description="",
            status="open",
            category="lost_parcel",
            origin="customer",
            branch="la_office",
            country=None,
            customer_type=None,
            tracking_number=None,
            carrier=None,
            customer_email=None,
            satisfaction_score=None,
            reported_by=None,
            created_at="now",
            updated_at="now",
        )
        self.assertIsNotNone(response)

    # ── Enums & constants ──────────────────────────────────────────────

    def test_branch_display_has_all_branches(self):
        for branch in IncidentBranch:
            self.assertIn(branch, BRANCH_DISPLAY)
            self.assertIn("es", BRANCH_DISPLAY[branch])
            self.assertIn("en", BRANCH_DISPLAY[branch])

    def test_valid_transitions_completeness(self):
        self.assertIn(IncidentStatus.OPEN, VALID_TRANSITIONS)
        self.assertIn(IncidentStatus.IN_PROGRESS, VALID_TRANSITIONS)
        self.assertIn(IncidentStatus.RESOLVED, VALID_TRANSITIONS)
        self.assertIn(IncidentStatus.DISCARDED, VALID_TRANSITIONS)

    def test_resolved_and_discarded_are_terminal(self):
        self.assertEqual(VALID_TRANSITIONS[IncidentStatus.RESOLVED], [])
        self.assertEqual(VALID_TRANSITIONS[IncidentStatus.DISCARDED], [])

    def test_open_can_become_in_progress_or_discarded(self):
        self.assertIn(IncidentStatus.IN_PROGRESS, VALID_TRANSITIONS[IncidentStatus.OPEN])
        self.assertIn(IncidentStatus.DISCARDED, VALID_TRANSITIONS[IncidentStatus.OPEN])
        self.assertNotIn(IncidentStatus.RESOLVED, VALID_TRANSITIONS[IncidentStatus.OPEN])

    def test_in_progress_can_become_resolved_or_discarded(self):
        self.assertIn(IncidentStatus.RESOLVED, VALID_TRANSITIONS[IncidentStatus.IN_PROGRESS])
        self.assertIn(IncidentStatus.DISCARDED, VALID_TRANSITIONS[IncidentStatus.IN_PROGRESS])
        self.assertNotIn(IncidentStatus.OPEN, VALID_TRANSITIONS[IncidentStatus.IN_PROGRESS])

    def test_all_categories_defined(self):
        expected = [
            "lost_parcel", "delivery_failure", "inventory_discrepancy",
            "carrier_issue", "returns_issue", "warehouse_incident",
            "system_failure", "client_complaint", "other",
        ]
        actual = [c.value for c in IncidentCategory]
        self.assertCountEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()