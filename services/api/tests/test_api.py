import unittest

import support

from app.main import app


class IncidentApiTests(support.ApiTestCase):
    def test_empty_upload_returns_descriptive_400(self):
        response = self.client.post(
            "/api/incidents/analyze",
            headers=self.headers,
            files={"file": ("empty.csv", b"", "text/csv")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("vacío", response.json()["detail"])

    def test_health_response_is_in_spanish(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"estado": "correcto"})

    def test_wrong_extension_returns_415(self):
        response = self.client.post(
            "/api/incidents/analyze",
            headers=self.headers,
            files={"file": ("incident.txt", b"test", "text/plain")},
        )
        self.assertEqual(response.status_code, 415)

    def test_valid_csv_returns_aggregates_and_export_has_no_source_email(self):
        header = (
            "incident_id,date,country,customer_type,tracking_number,carrier,"
            "category,description,status,customer_email,satisfaction_score\n"
        )
        row = (
            "TRF-000001,2026-01-01,US,B2C,TRACK12345,UPS,LOST_PARCEL,"
            "Parcel is missing,CLOSED,private@example.com,5\n"
        )
        response = self.client.post(
            "/api/incidents/analyze",
            headers=self.headers,
            files={"file": ("incidents.csv", (header + row).encode(), "text/csv")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["valid_records"], 1)
        self.assertNotIn("private@example.com", response.text)
        exported = self.client.get("/api/incidents/results/export", headers=self.headers)
        self.assertEqual(exported.status_code, 200)
        self.assertIn("total_registros,todos,1", exported.text)
        self.assertIn("categoría,Paquete perdido,1", exported.text)
        self.assertIn("estado,Cerrada,1", exported.text)
        self.assertNotIn("private@example.com", exported.text)

        other = self.store.create_user("otra@example.com", support.PASSWORD)
        other_headers = self.login_headers(other["email"])
        self.assertEqual(self.client.get("/api/incidents/results/export", headers=other_headers).status_code, 404)
        second_row = row.replace("TRF-000001", "TRF-000002").replace("TRACK12345", "TRACK67890")
        other_upload = self.client.post(
            "/api/incidents/analyze",
            headers=other_headers,
            files={"file": ("otra.csv", (header + row + second_row).encode(), "text/csv")},
        )
        self.assertEqual(other_upload.status_code, 200)
        self.assertEqual(other_upload.json()["valid_records"], 2)
        self.assertIn("total_registros,todos,1", self.client.get(
            "/api/incidents/results/export", headers=self.headers,
        ).text)
        self.assertIn("total_registros,todos,2", self.client.get(
            "/api/incidents/results/export", headers=other_headers,
        ).text)
        self.assertEqual(self.client.delete(f"/users/{self.user_uuid}", headers=self.headers).status_code, 204)
        self.assertNotIn(self.user_uuid, app.state.summaries)
        self.assertEqual(self.client.get("/api/incidents/results/export", headers=self.headers).status_code, 401)

    def test_export_before_analysis_returns_404(self):
        response = self.client.get("/api/incidents/results/export", headers=self.headers)
        self.assertEqual(response.status_code, 404)

    def test_incident_routes_reject_missing_or_invalid_session(self):
        for headers in ({}, {"Authorization": "Bearer invalido"}):
            with self.subTest(headers=headers):
                uploaded = self.client.post(
                    "/api/incidents/analyze", headers=headers,
                    files={"file": ("incidents.csv", b"no-debe-procesarse", "text/csv")},
                )
                self.assertEqual(uploaded.status_code, 401)
                exported = self.client.get("/api/incidents/results/export", headers=headers)
                self.assertEqual(exported.status_code, 401)
                self.assertEqual(app.state.summaries, {})


if __name__ == "__main__":
    unittest.main()