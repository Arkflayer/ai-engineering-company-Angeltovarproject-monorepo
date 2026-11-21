"""Persistencia de incidencias en TinyDB."""
from __future__ import annotations

import csv
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import TextIO
from uuid import UUID

from tinydb import TinyDB

import sys
from pathlib import Path

_SHARED_PATH = Path(__file__).resolve().parents[5] / "packages" / "shared"
if str(_SHARED_PATH) not in sys.path:
    sys.path.insert(0, str(_SHARED_PATH))

from validation.csv_validation import CSVFormatError, analyze_rows, validate_row  # noqa: E402
from app.domains.incidents.models import (
    BRANCH_DISPLAY,
    CATEGORY_DISPLAY,
    Incident,
    IncidentCategory,
    IncidentCreate,
    IncidentStatus,
    VALID_TRANSITIONS,
)


# Mapeo CSV -> modelo para seed
CSV_STATUS_MAP = {
    "OPEN": "open",
    "CLOSED": "resolved",
    "DISCARDED": "discarded",
}
CSV_CATEGORY_MAP = {
    "LOST_PARCEL": "lost_parcel",
    "DELAYED_DELIVERY": "carrier_issue",
    "WRONG_ADDRESS": "delivery_failure",
    "RETURN_REQUEST": "returns_issue",
    "DAMAGE": "carrier_issue",
}
CSV_COUNTRY_MAP = {
    "US": "la_office",
    "ES": "zaragoza_office",
}


class IncidentStore:
    """Almacena y gestiona incidencias usando TinyDB."""

    def __init__(self, location: str) -> None:
        self.db_path = location
        location_path = Path(location)
        location_path.parent.mkdir(parents=True, exist_ok=True)
        location_path.touch(mode=0o600, exist_ok=True)
        self.db = TinyDB(location, encoding='utf-8')
        self.incidents = self.db.table("incidents")
        self.lock = RLock()

    def close(self) -> None:
        self.db.close()

    def create(self, payload: IncidentCreate, reported_by: str | None = None) -> dict:
        incident = Incident(
            **payload.model_dump(mode="json"),
            reported_by=UUID(reported_by) if reported_by else None,
        )
        doc = incident.model_dump(mode="json")
        doc["id"] = str(doc["id"])
        doc["reported_by"] = str(doc["reported_by"]) if doc["reported_by"] else None
        doc["created_at"] = doc["created_at"]
        doc["updated_at"] = doc["updated_at"]
        with self.lock:
            self.incidents.insert(doc)
            return dict(doc)

    def get(self, incident_id: str) -> dict | None:
        from tinydb import Query

        with self.lock:
            item = self.incidents.get(Query().id == incident_id)
            return dict(item) if item else None

    def list(self, filters: dict | None = None) -> list[dict]:
        with self.lock:
            items = [dict(item) for item in self.incidents.all()]
        if filters:
            for key, value in filters.items():
                if value is not None:
                    items = [item for item in items if item.get(key) == value]
        return items

    def update_status(self, incident_id: str, new_status: str) -> dict | None:
        from tinydb import Query

        with self.lock:
            item = self.incidents.get(Query().id == incident_id)
            if item is None:
                return None

            current_status = item.get("status")
            if current_status not in [s.value for s in VALID_TRANSITIONS]:
                return None

            try:
                from_enum = IncidentStatus(current_status)
                to_enum = IncidentStatus(new_status)
            except ValueError:
                return None

            if to_enum not in VALID_TRANSITIONS.get(from_enum, set()):
                return None

            now = datetime.now(timezone.utc).isoformat()
            updates = {"status": new_status, "updated_at": now}
            self.incidents.update(updates, Query().id == incident_id)

            return self.get(incident_id)

    def summary(self) -> dict:
        with self.lock:
            items = [dict(item) for item in self.incidents.all()]

        status_counts: dict[str, int] = {}
        category_counts: dict[str, int] = {}
        origin_counts: dict[str, int] = {}
        branch_counts: dict[str, int] = {}

        for item in items:
            s = item.get("status", "unknown")
            status_counts[s] = status_counts.get(s, 0) + 1

            c = item.get("category", "unknown")
            category_counts[c] = category_counts.get(c, 0) + 1

            o = item.get("origin", "unknown")
            origin_counts[o] = origin_counts.get(o, 0) + 1

            b = item.get("branch", "unknown")
            branch_counts[b] = branch_counts.get(b, 0) + 1

        return {
            "total": len(items),
            "by_status": status_counts,
            "by_category": category_counts,
            "by_origin": origin_counts,
            "by_branch": branch_counts,
        }

    def seed_from_csv(self, stream: TextIO) -> dict:
        """Lee un CSV historico y lo inserta en la BD.

        Aplica las transformaciones CSV -> modelo definidas en el BRIEFING:
          - status: OPEN -> open, CLOSED -> resolved, DISCARDED -> discarded
          - category: LOST_PARCEL -> lost_parcel, DELAYED_DELIVERY / DAMAGE -> carrier_issue,
                      WRONG_ADDRESS -> delivery_failure, RETURN_REQUEST -> returns_issue
          - description -> title (primeros 120 caracteres)
          - date -> created_at
          - country -> branch (US -> la_office, ES -> zaragoza_office)

        Es idempotente: no duplica registros si se ejecuta dos veces.

        Devuelve estadisticas de la carga.
        """
        reader = csv.DictReader(stream, strict=True)
        if not reader.fieldnames:
            raise CSVFormatError("El CSV esta vacio o no tiene encabezado.")

        inserted = 0
        skipped = 0
        errors: list[str] = []

        with self.lock:
            existing = self.incidents.all()
            existing_ids = {item.get("incident_id") for item in existing if item.get("incident_id")}
            existing_keys = set()
            for item in existing:
                title = item.get("title", "")
                created = str(item.get("created_at", ""))[:10]
                existing_keys.add((title, created))

            for row in reader:
                if row is None:
                    continue
                if None in row:
                    errors.append("Fila con mas columnas que el encabezado")
                    skipped += 1
                    continue

                incident_id = (row.get("incident_id") or "").strip()
                description = (row.get("description") or "").strip()
                csv_status = (row.get("status") or "").strip()
                csv_category = (row.get("category") or "").strip()
                csv_country = (row.get("country") or "").strip()
                raw_date = (row.get("date") or "").strip()

                # Validar fila usando la logica compartida de packages/shared/
                seen_ids: set[str] = set()
                validation_errors = validate_row(row, seen_ids)
                if validation_errors:
                    for verr in validation_errors:
                        errors.append(f"Fila {incident_id or '(sin ID)'}: {verr}")
                    skipped += 1
                    continue

                # Idempotencia: incident_id ya existe
                if incident_id and incident_id in existing_ids:
                    skipped += 1
                    continue

                # Title: primeros 120 caracteres de description
                title = description[:120].strip()
                if not title:
                    errors.append(f"Descripcion vacia tras recortar titulo: {incident_id or 'sin ID'}")
                    skipped += 1
                    continue

                # Idempotencia por title+date
                dup_key = (title, raw_date[:10] if raw_date else "")
                if dup_key in existing_keys:
                    skipped += 1
                    continue

                # Mapear campos CSV -> modelo
                mapped_status = CSV_STATUS_MAP.get(csv_status, csv_status.lower())
                mapped_category = CSV_CATEGORY_MAP.get(csv_category, csv_category.lower())
                mapped_branch = CSV_COUNTRY_MAP.get(csv_country, "central")

                try:
                    created_at = (
                        datetime.strptime(raw_date, "%Y-%m-%d").isoformat()
                        if raw_date
                        else datetime.now(timezone.utc).isoformat()
                    )
                except ValueError:
                    created_at = datetime.now(timezone.utc).isoformat()

                doc = {
                    "id": incident_id or str(uuid.uuid4()),
                    "title": title,
                    "description": description,
                    "category": mapped_category,
                    "status": mapped_status,
                    "origin": "customer",
                    "branch": mapped_branch,
                    "created_at": created_at,
                    "updated_at": created_at,
                    "reported_by": None,
                }

                self.incidents.insert(doc)
                existing_ids.add(doc["id"])
                existing_keys.add(dup_key)
                inserted += 1

        return {
            "inserted": inserted,
            "skipped": skipped,
            "total_in_db": len(self.incidents),
            "errors": errors,
        }
