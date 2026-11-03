import csv
import contextlib
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services" / "api"))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from app.domains.incidents.analysis import analyze_csv, write_results_csv
from analyze import main as cli_main

HEADER = "incident_id,date,country,customer_type,tracking_number,carrier,category,description,status,customer_email,satisfaction_score\n"
VALID = "TRF-000001,2026-01-01,US,B2C,TRACK12345,UPS,LOST_PARCEL,Parcel is missing,CLOSED,private@example.com,5\n"


class IncidentAnalysisTests(unittest.TestCase):
    def test_cli_exports_to_results_csv_when_confirmed(self):
        fixture = Path(__file__).resolve().parents[2] / "data" / "eval" / "incidents-trackflow.synthetic.csv"
        with tempfile.TemporaryDirectory() as directory:
            previous_directory = Path.cwd()
            output = io.StringIO()
            try:
                os.chdir(directory)
                with patch.object(sys, "argv", ["analyze.py", str(fixture)]), patch("builtins.input", return_value="s"), contextlib.redirect_stdout(output):
                    self.assertEqual(cli_main(), 0)
                exported = Path("results.csv")
                self.assertTrue(exported.is_file())
                self.assertNotIn("resultados.csv", output.getvalue())
                self.assertIn("100", exported.read_text(encoding="utf-8"))
            finally:
                os.chdir(previous_directory)

    def test_synthetic_acceptance_fixture_matches_brief(self):
        fixture = Path(__file__).resolve().parents[2] / "data" / "eval" / "incidents-trackflow.synthetic.csv"
        with fixture.open(encoding="utf-8", newline="") as stream:
            summary = analyze_csv(stream)

        self.assertEqual((summary["total_records"], summary["valid_records"], summary["invalid_records"]), (100, 95, 5))
        self.assertEqual(summary["by_category"], {
            "LOST_PARCEL": 14, "DELAYED_DELIVERY": 38, "WRONG_ADDRESS": 19,
            "RETURN_REQUEST": 17, "DAMAGE": 7,
        })
        self.assertEqual(summary["by_status"], {"OPEN": 29, "CLOSED": 52, "DISCARDED": 14})
        self.assertEqual(summary["by_country"], {"US": 50, "ES": 45})
        self.assertEqual(summary["invalid_breakdown"], {
            "tracking_number": 1, "carrier": 1, "category": 1, "email": 1, "closed_no_score": 1,
        })
        self.assertEqual(summary["satisfaction"], {
            "scored_incidents": 52, "closed_incidents": 52, "average": 3.06,
            "by_score": {"1": 6, "2": 11, "3": 15, "4": 14, "5": 6},
        })

    def test_synthetic_fixture_uses_reserved_fake_email_domain(self):
        fixture = Path(__file__).resolve().parents[2] / "data" / "eval" / "incidents-trackflow.synthetic.csv"
        with fixture.open(encoding="utf-8", newline="") as stream:
            emails = [row["customer_email"] for row in csv.DictReader(stream) if row["customer_email"]]
        self.assertEqual(len(emails), 99)
        self.assertTrue(all(email.endswith("@example.invalid") for email in emails))

    def test_valid_csv_aggregates_without_returning_input(self):
        summary = analyze_csv(io.StringIO(HEADER + VALID))
        self.assertEqual((summary["total_records"], summary["valid_records"], summary["invalid_records"]), (1, 1, 0))
        self.assertEqual(summary["by_category"]["LOST_PARCEL"], 1)
        self.assertEqual(summary["satisfaction"]["average"], 5.0)
        self.assertNotIn("private@example.com", repr(summary))

    def test_invalid_rows_are_excluded_and_rule_counted(self):
        row = VALID.replace("TRACK12345", "short").replace(",UPS,", ",MRW,")
        summary = analyze_csv(io.StringIO(HEADER + row))
        self.assertEqual(summary["invalid_records"], 1)
        self.assertEqual(summary["valid_records"], 0)
        self.assertEqual(summary["invalid_breakdown"]["tracking_number"], 1)
        self.assertEqual(summary["invalid_breakdown"]["carrier"], 1)

    def test_csv_export_contains_aggregates_only(self):
        summary = analyze_csv(io.StringIO(HEADER + VALID))
        output = io.StringIO()
        write_results_csv(summary, output)
        self.assertNotIn("private@example.com", output.getvalue())
        self.assertIn("total_registros,todos,1", output.getvalue())
        self.assertIn("categoría,Paquete perdido,1", output.getvalue())
        self.assertIn("estado,Cerrada,1", output.getvalue())

    def test_missing_header_column_rejected(self):
        with self.assertRaises(ValueError):
            analyze_csv(io.StringIO("incident_id,date\n"))


if __name__ == "__main__":
    unittest.main()
