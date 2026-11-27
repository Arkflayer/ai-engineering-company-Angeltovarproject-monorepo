#!/usr/bin/env python3
"""Seed the centralized incident store from the synthetic CSV dataset.

Usage:
    python scripts/seed_incidents.py

Reads data/eval/incidents-trackflow.synthetic.csv, validates each row using
the shared validation module, applies field transformations (status, category,
branch maps, date → created_at), and inserts valid records into TinyDB.

Idempotent: already-stored incident_ids are silently skipped.
Reports a summary of inserted and skipped rows.
"""
from __future__ import annotations

import sys
from pathlib import Path

# ── Monorepo discovery ──────────────────────────────────────────────────
# This script lives at /scripts/seed_incidents.py → parents[1] = monorepo root.
_MONOREPO = str(Path(__file__).resolve().parents[1])
if _MONOREPO not in sys.path:
    sys.path.insert(0, _MONOREPO)

# The API package lives under services/api/.
_API = str(Path(_MONOREPO) / "services" / "api")
if _API not in sys.path:
    sys.path.insert(0, _API)

# ---------------------------------------------------------------------------

import csv
import os
from datetime import datetime, timezone
from collections import Counter

from packages.shared.validation import validate_row, REQUIRED_COLUMNS, RULE_LABELS
from app.domains.incidents.models import (
    Incident,
    IncidentCategory,
    IncidentStatus,
    IncidentBranch,
)
from app.domains.incidents.storage import IncidentStore
from app.domains.incidents.seed import (
    STATUS_MAP,
    CATEGORY_MAP,
    BRANCH_MAP,
    _description_to_title,
    _get_db_path,
)

# ── Paths ───────────────────────────────────────────────────────────────
_CSV_PATH = Path(_MONOREPO) / "data" / "eval" / "incidents-trackflow.synthetic.csv"


def _parse_csv_rows() -> tuple[list[dict], Counter]:
    """Read CSV, validate, apply transformations, return (payloads, skip_reasons)."""
    if not _CSV_PATH.exists():
        raise FileNotFoundError(
            f"No se encuentra el fichero CSV sintético: {_CSV_PATH}. "
            "Asegúrate de que data/eval/incidents-trackflow.synthetic.csv existe."
        )

    payloads: list[dict] = []
    skip_reasons: Counter = Counter()
    seen_ids: set[str] = set()

    with _CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError("El CSV no tiene cabeceras o está vacío.")

        for row in reader:
            incident_id = (row.get("incident_id") or "").strip()

            # ── Validate via shared module ──────────────────────────────
            errors = validate_row(dict(row), seen_ids)

            if errors:
                for rule in errors:
                    skip_reasons[rule] += 1
                continue

            country = (row.get("country") or "").strip()
            raw_status = (row.get("status") or "").strip()
            raw_category = (row.get("category") or "").strip()
            description = (row.get("description") or "").strip()
            score_text = (row.get("satisfaction_score") or "").strip()
            raw_date = (row.get("date") or "").strip()

            # ── Apply mappings ──────────────────────────────────────────
            status = STATUS_MAP.get(raw_status, IncidentStatus.OPEN)
            category = CATEGORY_MAP.get(raw_category, IncidentCategory.OTHER)
            branch = BRANCH_MAP.get(country, IncidentBranch.CENTRAL)
            title = _description_to_title(description)
            satisfaction_score = int(score_text) if score_text.isdigit() else None
            # CSV date (YYYY-MM-DD) → created_at ISO datetime string
            created_at = f"{raw_date}T00:00:00" if raw_date else datetime.now(timezone.utc).isoformat()

            payload = Incident(
                id=incident_id,
                title=title,
                description=description,
                status=status,
                category=category,
                origin="customer",
                branch=branch,
                country=country,
                customer_type=(row.get("customer_type") or "").strip() or None,
                tracking_number=(row.get("tracking_number") or "").strip() or None,
                carrier=(row.get("carrier") or "").strip() or None,
                customer_email=(row.get("customer_email") or "").strip() or None,
                satisfaction_score=satisfaction_score,
                reported_by="system",
                created_at=created_at,
            ).model_dump(mode="json")

            payloads.append(payload)

    return payloads, skip_reasons


def main() -> None:
    """Validate, seed, and report."""
    payloads, skip_reasons = _parse_csv_rows()

    if not payloads and not skip_reasons:
        print("No se encontraron datos en el CSV.")
        return

    # ── Persist ─────────────────────────────────────────────────────────
    store = IncidentStore(_get_db_path())
    try:
        inserted = store.seed(payloads)
    finally:
        store.close()

    total_processed = len(payloads) + sum(skip_reasons.values())

    # ── Report ──────────────────────────────────────────────────────────
    print("=" * 60)
    print("  TRACKFLOW — SEMBRADO DE INCIDENCIAS")
    print(f"  Archivo: {_CSV_PATH.name}")
    print("=" * 60)
    print(f"\nRegistros procesados .................. {total_processed}")
    print(f"  ├─ Insertados ....................... {inserted}")
    print(f"  ├─ Ya existentes (saltados) ........ {len(payloads) - inserted}")
    print(f"  └─ Inválidos (saltados) ............. {sum(skip_reasons.values())}")

    if skip_reasons:
        print("\nDESGLOSE DE REGISTROS INVÁLIDOS")
        for rule, label in RULE_LABELS.items():
            count = skip_reasons.get(rule, 0)
            if count:
                print(f"  ├─ {label:<34} {count}")

    print()


if __name__ == "__main__":
    main()