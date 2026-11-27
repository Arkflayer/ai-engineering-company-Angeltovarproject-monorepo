"""Validación y agregación de CSV de incidencias con protección de privacidad.

This module re-exports from the shared validation library at
packages/shared/validation/ to keep the API app decoupled from
the package layout while maintaining a single source of truth.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Mapping, TextIO

# Make monorepo root importable so packages/shared/ is reachable.
_monorepo = str(Path(__file__).resolve().parents[5])
if _monorepo not in sys.path:
    sys.path.insert(0, _monorepo)

from packages.shared.validation.csv_validation import (  # noqa: E402
    CARRIERS,
    CATEGORIES,
    COUNTRIES,
    CSVFormatError,
    CUSTOMER_TYPES,
    REQUIRED_COLUMNS,
    RULE_LABELS,
    STATUSES,
    analyze_rows,
    analyze_csv as _analyze_csv,
    metric_rows as _metric_rows,
    validate_row,
    write_results_csv as _write_results_csv,
)

# Convenience wrappers so existing callers (router, scripts/analyze.py) continue
# to work without changing imports.  The canonical implementation lives in
# packages/shared/validation/csv_validation.py.


def analyze_csv(stream: TextIO) -> dict:
    return _analyze_csv(stream)


def metric_rows(summary: Mapping) -> list[tuple[str, str, str]]:
    return _metric_rows(summary)


def write_results_csv(summary: Mapping, stream: TextIO) -> None:
    _write_results_csv(summary, stream)


__all__ = [
    "CARRIERS",
    "CATEGORIES",
    "COUNTRIES",
    "CSVFormatError",
    "CUSTOMER_TYPES",
    "REQUIRED_COLUMNS",
    "RULE_LABELS",
    "STATUSES",
    "analyze_csv",
    "analyze_rows",
    "metric_rows",
    "write_results_csv",
]
