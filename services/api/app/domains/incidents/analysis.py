"""Validación y agregación de CSV de incidencias con protección de privacidad.
Reexporta desde packages/shared/validation/csv_validation.py para mantener
compatibilidad con código existente.
"""
from __future__ import annotations

from typing import Mapping, TextIO

# Importar desde el paquete compartido — la lógica de validación
# transversal vive en packages/shared/validation/csv_validation.py
import sys
from pathlib import Path

_SHARED_PATH = Path(__file__).resolve().parents[5] / "packages" / "shared"
if str(_SHARED_PATH) not in sys.path:
    sys.path.insert(0, str(_SHARED_PATH))

# Reexportar todo desde el módulo compartido
from validation.csv_validation import (  # noqa: E402, F401
    CARRIERS,
    CATEGORIES,
    COUNTRIES,
    CSVFormatError,
    CUSTOMER_TYPES,
    REQUIRED_COLUMNS,
    RULE_LABELS,
    STATUSES,
    analyze_csv,
    analyze_rows,
    metric_rows,
    validate_row,
    write_results_csv,
)
