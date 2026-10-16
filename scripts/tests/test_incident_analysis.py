import io
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services" / "api"))
from app.domains.incidents.analysis import analyze_csv, write_results_csv

HEADER = "incident_id,date,country,customer_type,tracking_number,carrier,category,description,status,customer_email,satisfaction_score\n"
VALID = "TRF-000001,2026-01-01,US,B2C,TRACK12345,UPS,LOST_PARCEL,Parcel is missing,CLOSED,private@example.com,5\n"


class IncidentAnalysisTests(unittest.TestCase):
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
