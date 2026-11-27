"""Tests for the incident CRUD API endpoints."""
from __future__ import annotations

import json
import unittest

from pydantic import ValidationError

from tests.support import ApiTestCase
from app.domains.incidents.models import (
    IncidentCategory,
    IncidentCreate,
    IncidentBranch,
    IncidentStatus,
)


class IncidentApiTests(ApiTestCase):
    """Validates the REST API for centralized incident management."""

    def test_create_incident(self):
        payload = {
            "title": "Paquete perdido",
            "description": "Descripción del paquete perdido",
            "category": "lost_parcel",
            "branch": "la_office",
            "country": "US",
            "customer_type": "B2C",
            "customer_email": "cli@example.com",
        }
        response = self.client.post("/api/incidents", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 201, response.text)
        data = response.json()
        self.assertEqual(data["title"], "Paquete perdido")
        self.assertEqual(data["status"], "open")
        self.assertIn("id", data)

    def test_create_returns_400_on_validation_error(self):
        response = self.client.post("/api/incidents", json={}, headers=self.headers)
        self.assertEqual(response.status_code, 400, response.text)

    def test_create_requires_auth(self):
        payload = {
            "title": "Test",
            "description": "Descripción",
            "category": "lost_parcel",
            "branch": "la_office",
        }
        response = self.client.post("/api/incidents", json=payload)
        self.assertEqual(response.status_code, 401, response.text)

    def test_list_incidents(self):
        self.client.post("/api/incidents", json={
            "title": "Inc 1", "description": "Descripción inc 1", "category": "lost_parcel", "branch": "la_office", "country": "US",
        }, headers=self.headers)
        self.client.post("/api/incidents", json={
            "title": "Inc 2", "description": "Descripción inc 2", "category": "carrier_issue", "branch": "zaragoza_office", "country": "ES",
        }, headers=self.headers)
        response = self.client.get("/api/incidents", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_list_filters_by_status(self):
        self.client.post("/api/incidents", json={
            "title": "Open inc", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers)
        response = self.client.get("/api/incidents?status=open", headers=self.headers)
        self.assertEqual(len(response.json()), 1)
        response = self.client.get("/api/incidents?status=resolved", headers=self.headers)
        self.assertEqual(len(response.json()), 0)

    def test_list_filters_by_country(self):
        self.client.post("/api/incidents", json={
            "title": "US inc", "description": "Desc", "category": "lost_parcel", "branch": "la_office", "country": "US",
        }, headers=self.headers)
        response = self.client.get("/api/incidents?country=US", headers=self.headers)
        self.assertEqual(len(response.json()), 1)
        response = self.client.get("/api/incidents?country=ES", headers=self.headers)
        self.assertEqual(len(response.json()), 0)

    def test_list_filters_by_category(self):
        self.client.post("/api/incidents", json={
            "title": "Lost", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers)
        response = self.client.get("/api/incidents?category=lost_parcel", headers=self.headers)
        self.assertEqual(len(response.json()), 1)
        response = self.client.get("/api/incidents?category=carrier_issue", headers=self.headers)
        self.assertEqual(len(response.json()), 0)

    def test_list_filters_by_branch(self):
        self.client.post("/api/incidents", json={
            "title": "LA", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers)
        response = self.client.get("/api/incidents?branch=la_office", headers=self.headers)
        self.assertEqual(len(response.json()), 1)
        response = self.client.get("/api/incidents?branch=zaragoza_office", headers=self.headers)
        self.assertEqual(len(response.json()), 0)

    def test_get_incident(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        response = self.client.get(f"/api/incidents/{created['id']}", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], created["id"])

    def test_get_nonexistent_returns_404(self):
        response = self.client.get("/api/incidents/nonexistent", headers=self.headers)
        self.assertEqual(response.status_code, 404)

    def test_update_incident_status(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        response = self.client.patch(
            f"/api/incidents/{created['id']}",
            json={"status": "in_progress"},
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "in_progress")

    def test_update_incident_description(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        response = self.client.patch(
            f"/api/incidents/{created['id']}",
            json={"description": "Nueva descripción"},
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["description"], "Nueva descripción")

    def test_update_rejects_invalid_transition(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        response = self.client.patch(
            f"/api/incidents/{created['id']}",
            json={"status": "resolved"},  # open → resolved not allowed
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 400)

    def test_update_resolved_allows_score(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        # open → in_progress
        self.client.patch(
            f"/api/incidents/{created['id']}",
            json={"status": "in_progress"},
            headers=self.headers,
        )
        # in_progress → resolved + score
        response = self.client.patch(
            f"/api/incidents/{created['id']}",
            json={"status": "resolved", "satisfaction_score": 5},
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["satisfaction_score"], 5)

    def test_update_nonexistent_returns_404(self):
        response = self.client.patch(
            "/api/incidents/nonexistent",
            json={"description": "Nope"},
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_incident(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        response = self.client.delete(f"/api/incidents/{created['id']}", headers=self.headers)
        self.assertEqual(response.status_code, 204)

    def test_delete_removes_incident(self):
        created = self.client.post("/api/incidents", json={
            "title": "Test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        self.client.delete(f"/api/incidents/{created['id']}", headers=self.headers)
        get_resp = self.client.get(f"/api/incidents/{created['id']}", headers=self.headers)
        self.assertEqual(get_resp.status_code, 404)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete("/api/incidents/nonexistent", headers=self.headers)
        self.assertEqual(response.status_code, 404)

    def test_summary(self):
        self.client.post("/api/incidents", json={
            "title": "Inc 1", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers)
        self.client.post("/api/incidents", json={
            "title": "Inc 2", "description": "Desc", "category": "carrier_issue", "branch": "zaragoza_office",
        }, headers=self.headers)
        response = self.client.get("/api/incidents/summary", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 2)
        self.assertEqual(data["by_status"]["open"], 2)

    def test_summary_requires_auth(self):
        response = self.client.get("/api/incidents/summary")
        self.assertEqual(response.status_code, 401)

    def test_summary_empty(self):
        response = self.client.get("/api/incidents/summary", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 0)

    def test_list_requires_auth(self):
        response = self.client.get("/api/incidents")
        self.assertEqual(response.status_code, 401)

    def test_get_requires_auth(self):
        response = self.client.get("/api/incidents/some-id")
        self.assertEqual(response.status_code, 401)

    def test_patch_requires_auth(self):
        response = self.client.patch("/api/incidents/some-id", json={"description": "x"})
        self.assertEqual(response.status_code, 401)

    def test_delete_requires_auth(self):
        response = self.client.delete("/api/incidents/some-id")
        self.assertEqual(response.status_code, 401)

    def test_list_date_filters(self):
        inc = self.client.post("/api/incidents", json={
            "title": "Date test", "description": "Desc", "category": "lost_parcel", "branch": "la_office",
        }, headers=self.headers).json()
        # Filter by a date that should be before and after the created_at
        created_date = inc["created_at"][:10]
        response = self.client.get(
            f"/api/incidents?date_from={created_date}", headers=self.headers
        )
        self.assertGreaterEqual(len(response.json()), 1)
        response = self.client.get(
            "/api/incidents?date_from=2099-01-01", headers=self.headers
        )
        self.assertEqual(len(response.json()), 0)