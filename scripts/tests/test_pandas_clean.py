import contextlib
import io
import runpy
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[2] / "skills" / "data-analysis" / "scripts" / "pandas_clean.py"


class PandasCleanCliTests(unittest.TestCase):
    def setUp(self):
        self.pandas = types.ModuleType("pandas")
        self.pandas.errors = types.SimpleNamespace(
            ParserError=type("ParserError", (Exception,), {}),
            EmptyDataError=type("EmptyDataError", (Exception,), {}),
        )
        self.stderr = io.StringIO()

    def run_script(self, argv):
        with patch.dict(sys.modules, {"pandas": self.pandas}), patch.object(sys, "argv", argv), contextlib.redirect_stderr(self.stderr):
            runpy.run_path(str(SCRIPT), run_name="__main__")

    def test_rejects_extra_positional_arguments(self):
        with self.assertRaises(SystemExit) as raised:
            self.run_script([str(SCRIPT), "input.csv", "unexpected.csv"])
        self.assertEqual(raised.exception.code, 2)
        self.assertIn("unrecognized arguments", self.stderr.getvalue())

    def test_missing_csv_exits_nonzero_with_safe_message(self):
        with self.assertRaises(SystemExit) as raised:
            self.run_script([str(SCRIPT), "missing.csv"])
        self.assertEqual(raised.exception.code, 1)
        self.assertIn("No se pudo leer el CSV", self.stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
