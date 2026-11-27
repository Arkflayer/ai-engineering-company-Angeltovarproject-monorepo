"""Seed the centralized incident store from the synthetic CSV dataset."""
from __future__ import annotations

import csv
import os
from datetime import datetime, timezone
from pathlib import Path

from app.domains.incidents.models import Incident, IncidentCategory, IncidentStatus, IncidentBranch
from app.domains.incidents.storage import IncidentStore

# ── Shared CSV validation (single source of truth, via analysis re-export) ──
from app.domains.incidents.analysis import validate_row

# ── Status mapping (CSV → model) ────────────────────────────────────────
STATUS_MAP: dict[str, IncidentStatus] = {
    "OPEN": IncidentStatus.OPEN,
    "CLOSED": IncidentStatus.RESOLVED,
    "DISCARDED": IncidentStatus.DISCARDED,
}

# ── Category mapping (CSV → model) ──────────────────────────────────────
CATEGORY_MAP: dict[str, IncidentCategory] = {
    "LOST_PARCEL": IncidentCategory.LOST_PARCEL,
    "DELAYED_DELIVERY": IncidentCategory.CARRIER_ISSUE,
    "WRONG_ADDRESS": IncidentCategory.DELIVERY_FAILURE,
    "RETURN_REQUEST": IncidentCategory.RETURNS_ISSUE,
    "DAMAGE": IncidentCategory.CARRIER_ISSUE,
}

# ── Country → Branch mapping (as defined in BRIEFING) ───────────────────
BRANCH_MAP: dict[str, IncidentBranch] = {
    "US": IncidentBranch.LA_OFFICE,
    "ES": IncidentBranch.ZARAGOZA_OFFICE,
}

_CSV_PATH = Path(__file__).resolve().parents[5] / "data" / "eval" / "incidents-trackflow.synthetic.csv"
_DEFAULT_DB_DIR = Path.home() / ".local" / "share" / "trackflow"
_DEFAULT_DB = str(_DEFAULT_DB_DIR / "incidents.json")


def _get_db_path() -> str:
    return os.environ.get("TRACKFLOW_INCIDENT_DB_PATH", _DEFAULT_DB)


def _description_to_title(description: str) -> str:
    """Truncate the description to at most 120 characters for use as title."""
    return description.strip()[:120]


def _parse_rows() -> list[dict]:
    """Read the CSV, validate through shared logic, apply mappings, return payloads.

    Invalid rows are reported to console and skipped.
    """
    if not _CSV_PATH.exists():
        raise FileNotFoundError(
            f"No se encuentra el fichero CSV sintético: {_CSV_PATH}. "
            "Asegúrate de que data/eval/incidents-trackflow.synthetic.csv existe."
        )

    payloads: list[dict] = []
    seen_ids: set[str] = set()
    total = 0
    invalid = 0

    with _CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            incident_id = (row.get("incident_id") or "").strip()
            if not incident_id:
                continue
            total += 1

            # Shared validation (passes seen_ids across rows for dup detection)
            errors = validate_row(row, seen_ids)
            if errors:
                print(f"  [{incident_id}] Error(es): {', '.join(errors)}", flush=True)
                invalid += 1
                continue

            country = (row.get("country") or "").strip()
            raw_status = (row.get("status") or "").strip()
            raw_category = (row.get("category") or "").strip()
            description = (row.get("description") or "").strip()
            score_text = (row.get("satisfaction_score") or "").strip()
            raw_date = (row.get("date") or "").strip()

            # Apply BRIEFING mappings
            status = STATUS_MAP.get(raw_status, IncidentStatus.OPEN)
            category = CATEGORY_MAP.get(raw_category, IncidentCategory.OTHER)
            branch = BRANCH_MAP.get(country, IncidentBranch.CENTRAL)
            title = _description_to_title(description)
            satisfaction_score = int(score_text) if score_text.isdigit() else None
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

    print(f"CSV leído: {total} registros, {invalid} inválidos, {len(payloads)} válidos.", flush=True)
    return payloads


def seed() -> int:
    """Run idempotent seed and return the number of newly inserted records."""
    payloads = _parse_rows()
    store = IncidentStore(_get_db_path())
    try:
        return store.seed(payloads)
    finally:
        store.close()


def main() -> None:
    inserted = seed()
    print(f"Incidencias insertadas: {inserted}")


if __name__ == "__main__":
    main()