#!/usr/bin/env python3
"""Carga el CSV histórico de incidencias al gestor de incidencias de TrackFlow.

Uso:
    python scripts/seed_incidents.py

Requiere que el servicio API tenga su configuración de base de datos disponible
(variables de entorno o .env). Ejecuta las mismas transformaciones CSV → modelo
que el endpoint POST /api/incidents/seed.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "services" / "api"))

# La lógica de validación compartida está en packages/shared/
_SHARED_PATH = REPO_ROOT / "packages" / "shared"
if str(_SHARED_PATH) not in sys.path:
    sys.path.insert(0, str(_SHARED_PATH))

from validation.csv_validation import CSVFormatError
from app.domains.incidents.storage import IncidentStore
from app.security import get_settings


def main() -> int:
    settings = get_settings()
    store = IncidentStore(settings.incidents_db_path)

    csv_path = REPO_ROOT / "data" / "eval" / "incidents-trackflow.synthetic.csv"
    if not csv_path.is_file():
        print(f"ERROR: No se encuentra el CSV en {csv_path}", file=sys.stderr)
        return 1

    print(f"Leyendo incidencias desde: {csv_path}")
    try:
        with csv_path.open("r", encoding="utf-8", newline="") as f:
            import io
            result = store.seed_from_csv(io.StringIO(f.read()))
    except CSVFormatError as exc:
        print(f"Error de formato CSV: {exc}", file=sys.stderr)
        return 2
    except OSError as exc:
        print(f"Error de lectura del archivo: {exc}", file=sys.stderr)
        return 3

    print(f"\nInsertadas: {result['inserted']}")
    print(f"Omitidas:   {result['skipped']}")
    print(f"Total en BD:{result['total_in_db']}")

    if result["errors"]:
        print("\nErrores durante la carga:")
        for err in result["errors"]:
            print(f"  - {err}")

    if result["inserted"]:
        print("\n✅ Carga completada.")
    else:
        print("\nℹ️  No se insertaron registros nuevos (idempotencia).")

    store.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())