"""Tests for the CSV-to-incident seed pipeline."""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from app.domains.incidents.seed import _parse_rows, seed, _get_db_path, _CSV_PATH


class SeedParsingTests(unittest.TestCase):
    """Validates that the synthetic CSV is parsed correctly."""

    def test_parse_returns_95_rows(self):
        rows = _parse_rows()
        self.assertEqual(len(rows), 95)

    def test_parse_id_values_are_trackflow_format(self):
        rows = _parse_rows()
        for row in rows:
            self.assertRegex(row["id"], r"^TRF-\d{6}$")

    def test_parse_statuses_mapped(self):
        rows = _parse_rows()
        statuses = {row["status"] for row in rows}
        self.assertIn("open", statuses)
        self.assertIn("resolved", statuses)
        self.assertIn("discarded", statuses)

    def test_parse_categories_mapped(self):
        rows = _parse_rows()
        categories = {row["category"] for row in rows}
        self.assertIn("lost_parcel", categories)
        self.assertIn("carrier_issue", categories)
        self.assertIn("delivery_failure", categories)
        self.assertIn("returns_issue", categories)

    def test_parse_origin_is_customer(self):
        rows = _parse_rows()
        for row in rows:
            self.assertEqual(row["origin"], "customer")

    def test_parse_branch_mapped_by_country(self):
        rows = _parse_rows()
        for row in rows:
            if row["country"] == "US":
                self.assertEqual(row["branch"], "la_office")
            elif row["country"] == "ES":
                self.assertEqual(row["branch"], "zaragoza_office")

    def test_parse_title_is_truncated_description(self):
        rows = _parse_rows()
        for row in rows:
            expected_title = (row["description"] or "").strip()[:120]
            self.assertEqual(row["title"], expected_title)

    def test_parse_satisfaction_scores_on_closed_only(self):
        rows = _parse_rows()
        for row in rows:
            if row["satisfaction_score"] is not None:
                self.assertEqual(row["status"], "resolved")
                self.assertIsInstance(row["satisfaction_score"], int)
                self.assertIn(row["satisfaction_score"], range(1, 6))

    def test_parse_count_distribution(self):
        rows = _parse_rows()
        from collections import Counter

        statuses = Counter(r["status"] for r in rows)
        categories = Counter(r["category"] for r in rows)
        countries = Counter(r["country"] for r in rows)

        self.assertEqual(statuses["open"], 29)
        self.assertEqual(statuses["resolved"], 52)
        self.assertEqual(statuses["discarded"], 14)

        self.assertEqual(categories["lost_parcel"], 14)
        self.assertEqual(categories["carrier_issue"], 45)
        self.assertEqual(categories["delivery_failure"], 19)
        self.assertEqual(categories["returns_issue"], 17)

        self.assertEqual(countries["US"], 50)
        self.assertEqual(countries["ES"], 45)

    def test_skips_test_rows_096_to_100(self):
        rows = _parse_rows()
        ids = {int(r["id"].removeprefix("TRF-")) for r in rows}
        self.assertNotIn(96, ids)
        self.assertNotIn(97, ids)
        self.assertNotIn(98, ids)
        self.assertNotIn(99, ids)
        self.assertNotIn(100, ids)

    def test_parse_all_rows_have_reported_by_system(self):
        rows = _parse_rows()
        for row in rows:
            self.assertEqual(row["reported_by"], "system")

    def test_each_row_has_required_fields(self):
        rows = _parse_rows()
        required = {"id", "title", "description", "status", "category",
                     "origin", "branch", "country", "created_at", "updated_at"}
        for row in rows:
            missing = required - set(row.keys())
            self.assertEqual(
                missing, set(),
                f"Row {row.get('id')} missing fields: {missing}"
            )


class SeedIdempotencyTests(unittest.TestCase):
    """Validates that seed() is idempotent with a temporary DB file."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db_path = str(Path(self.tmp.name) / "incidents.json")

    def test_seed_returns_95_on_first_call(self):
        import os
        with unittest.mock.patch.dict(os.environ, {"TRACKFLOW_INCIDENT_DB_PATH": self.db_path}):
            inserted = seed()
            self.assertEqual(inserted, 95)

    def test_seed_returns_0_on_second_call(self):
        import os
        with unittest.mock.patch.dict(os.environ, {"TRACKFLOW_INCIDENT_DB_PATH": self.db_path}):
            seed()
            inserted = seed()
            self.assertEqual(inserted, 0)

    def test_seeded_data_is_readable(self):
        import os
        from app.domains.incidents.storage import IncidentStore
        with unittest.mock.patch.dict(os.environ, {"TRACKFLOW_INCIDENT_DB_PATH": self.db_path}):
            seed()
            store = IncidentStore(self.db_path)
            try:
                all_items = store.list()
                self.assertEqual(len(all_items), 95)
                s = store.summary()
                self.assertEqual(s["total"], 95)
            finally:
                store.close()


if __name__ == "__main__":
    unittest.main()