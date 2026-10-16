import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import app


class IncidentApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_empty_upload_returns_descriptive_400(self):
        response = self.client.post(
            "/api/incidents/analyze",
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
            files={"file": ("incident.txt", b"test", "text/plain")},
        )
        self.assertEqual(response.status_code, 415)

    def test_valid_csv_returns_aggregates_and_export_has_no_source_email(self):
        import app.main as main

        main._last_summary = None
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
            files={"file": ("incidents.csv", (header + row).encode(), "text/csv")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["valid_records"], 1)
        self.assertNotIn("private@example.com", response.text)
        exported = self.client.get("/api/incidents/results/export")
        self.assertEqual(exported.status_code, 200)
        self.assertIn("total_registros,todos,1", exported.text)
        self.assertIn("categoría,Paquete perdido,1", exported.text)
        self.assertIn("estado,Cerrada,1", exported.text)
        self.assertNotIn("private@example.com", exported.text)

    def test_export_before_analysis_returns_404(self):
        import app.main as main

        with main._summary_lock:
            main._last_summary = None
        response = self.client.get("/api/incidents/results/export")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()