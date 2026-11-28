"""Persistent TinyDB storage for the centralized incident manager."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import RLock

from tinydb import TinyDB, Query

from app.domains.incidents.models import (
    Incident,
    IncidentCreate,
    IncidentStatus,
    IncidentUpdate,
    IncidentCategory,
    IncidentBranch,
    VALID_TRANSITIONS,
)


class IncidentStore:
    def __init__(self, path: str):
        location = Path(path)
        location.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        location.touch(mode=0o600, exist_ok=True)
        self.db = TinyDB(location)
        self.incidents = self.db.table("incidents")
        self.lock = RLock()

    def close(self) -> None:
        self.db.close()

    # ------------------------------------------------------------------ CRUD

    def create(self, data: IncidentCreate, reported_by: str | None = None) -> dict:
        """Insert a new incident and return it with its generated id."""
        with self.lock:
            incident = Incident(
                **data.model_dump(mode="json"),
                reported_by=reported_by,
            )
            payload = incident.model_dump(mode="json")
            doc_id = self.incidents.insert(payload)
            return {**payload, "doc_id": doc_id}

    def get(self, incident_id: str) -> dict | None:
        """Fetch a single incident by its UUID."""
        with self.lock:
            Inv = Query()
            item = self.incidents.get(Inv.id == incident_id)
            if item is None:
                return None
            return {**dict(item)}

    def list(
        self,
        status: IncidentStatus | None = None,
        origin: str | None = None,
        category: IncidentCategory | None = None,
        country: str | None = None,
        branch: IncidentBranch | None = None,
        reported_by: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict]:
        """Return incidents matching the supplied filters (AND logic)."""
        with self.lock:
            items = self.incidents.all()
            result: list[dict] = [{**dict(item)} for item in items]

        if status:
            result = [i for i in result if i.get("status") == status.value]
        if origin:
            result = [i for i in result if i.get("origin") == origin]
        if category:
            result = [i for i in result if i.get("category") == category.value]
        if country:
            result = [i for i in result if i.get("country") == country]
        if branch:
            result = [i for i in result if i.get("branch") == branch.value]
        if reported_by:
            result = [i for i in result if i.get("reported_by") == reported_by]
        if date_from:
            result = [i for i in result if i.get("created_at", "") >= date_from]
        if date_to:
            result = [i for i in result if i.get("created_at", "") <= date_to]

        return result

    def update(self, incident_id: str, data: IncidentUpdate) -> dict | None:
        """Apply a partial update.  Validates status transitions."""
        with self.lock:
            Inv = Query()
            item = self.incidents.get(Inv.id == incident_id)
            if item is None:
                return None

            current_status = IncidentStatus(item["status"])
            updates: dict = {}

            if data.status is not None:
                new_status = data.status
                if new_status not in VALID_TRANSITIONS.get(current_status, []):
                    allowed = [s.value for s in VALID_TRANSITIONS.get(current_status, [])]
                    raise ValueError(
                        f"Transición inválida: {current_status.value} → {new_status.value}. "
                        f"Transiciones permitidas: {allowed}"
                    )
                updates["status"] = new_status.value

            if data.description is not None:
                updates["description"] = data.description
            if data.tracking_number is not None:
                updates["tracking_number"] = data.tracking_number
            if data.carrier is not None:
                updates["carrier"] = data.carrier
            if data.satisfaction_score is not None:
                if updates.get("status", item["status"]) != IncidentStatus.RESOLVED.value:
                    raise ValueError(
                        "satisfaction_score solo puede establecerse en incidencias resueltas."
                    )
                updates["satisfaction_score"] = data.satisfaction_score

            updates["updated_at"] = self._next_timestamp(dict(item))
            self.incidents.update(updates, Inv.id == incident_id)

            merged = {**dict(item), **updates}
            return merged

    def delete(self, incident_id: str) -> bool:
        """Remove an incident by UUID. Returns True if deleted."""
        with self.lock:
            Inv = Query()
            return bool(self.incidents.remove(Inv.id == incident_id))

    # --------------------------------------------------------------- summary

    def summary(self) -> dict:
        """Return aggregated counts grouped by status, category, origin, and branch."""
        with self.lock:
            items = self.incidents.all()

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

    # ---------------------------------------------------------------- seed

    def seed(self, incidents: list[dict]) -> int:
        """Insert new incidents, skipping any whose id already exists."""
        inserted = 0
        with self.lock:
            Inv = Query()
            existing_ids = {
                item.get("id") for item in self.incidents.all()
            }
            for payload in incidents:
                if payload.get("id") in existing_ids:
                    continue
                self.incidents.insert(payload)
                existing_ids.add(payload.get("id"))
                inserted += 1
        return inserted

    # ----------------------------------------------------------- internals

    @staticmethod
    def _next_timestamp(current: dict) -> str:
        now = datetime.now(timezone.utc)
        previous = current.get("updated_at")
        if previous:
            previous_at = datetime.fromisoformat(previous)
            if now <= previous_at:
                now = previous_at + timedelta(microseconds=1)
        return now.isoformat()