"""Persistent TinyDB storage for the supplier directory."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import RLock

from tinydb import TinyDB

from app.domains.suppliers.models import SupplierCreate, current_timestamp


class SupplierStore:
    def __init__(self, path: str):
        location = Path(path)
        location.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        location.touch(mode=0o600, exist_ok=True)
        self.db = TinyDB(location)
        self.suppliers = self.db.table("suppliers")
        self.status_history = self.db.table("supplier_status_history")
        self.lock = RLock()

    def close(self) -> None:
        self.db.close()

    def list(self) -> list[dict]:
        with self.lock:
            return [{**dict(item), "id": item.doc_id} for item in self.suppliers.all()]

    def get(self, supplier_id: int) -> dict | None:
        with self.lock:
            item = self.suppliers.get(doc_id=supplier_id)
            return {**dict(item), "id": supplier_id} if item else None

    def create(self, supplier: SupplierCreate) -> dict:
        with self.lock:
            payload = supplier.model_dump(mode="json")
            payload["updated_at"] = current_timestamp().isoformat()
            supplier_id = self.suppliers.insert(payload)
            return {**payload, "id": supplier_id}

    def update_rate(self, supplier_id: int, rate: float) -> dict | None:
        with self.lock:
            current = self.suppliers.get(doc_id=supplier_id)
            if current is None:
                return None
            self.suppliers.update(
                {"rate_per_shipment": rate, "updated_at": self._next_timestamp(current)},
                doc_ids=[supplier_id],
            )
            return self.get(supplier_id)

    def update_status(self, supplier_id: int, status: str) -> dict | None:
        with self.lock:
            current = self.suppliers.get(doc_id=supplier_id)
            if current is None:
                return None
            previous_status = current["status"]
            if previous_status != status:
                self.suppliers.update({"status": status}, doc_ids=[supplier_id])
                self.status_history.insert({
                    "supplier_id": supplier_id,
                    "previous_status": previous_status,
                    "status": status,
                    "changed_at": current_timestamp().isoformat(),
                })
            return self.get(supplier_id)

    def get_status_history(self, supplier_id: int) -> list[dict]:
        with self.lock:
            history = self.status_history.search(lambda item: item.get("supplier_id") == supplier_id)
            return sorted(history, key=lambda item: item["changed_at"])

    @staticmethod
    def _next_timestamp(current: dict) -> str:
        updated_at = datetime.now(timezone.utc)
        previous = current.get("updated_at")
        if previous:
            previous_at = datetime.fromisoformat(previous)
            if updated_at <= previous_at:
                updated_at = previous_at + timedelta(microseconds=1)
        return updated_at.isoformat()

    def delete(self, supplier_id: int) -> bool:
        with self.lock:
            return bool(self.suppliers.remove(doc_ids=[supplier_id]))

    def seed(self, suppliers: list[SupplierCreate]) -> int:
        """Insert missing names only, preserving existing records and updates."""
        inserted = 0
        with self.lock:
            existing_names = {item.get("name") for item in self.suppliers.all()}
            for supplier in suppliers:
                if supplier.name in existing_names:
                    continue
                payload = supplier.model_dump(mode="json")
                payload["updated_at"] = current_timestamp().isoformat()
                self.suppliers.insert(payload)
                existing_names.add(supplier.name)
                inserted += 1
        return inserted

    def filter(self, country: str | None = None, category: str | None = None) -> list[dict]:
        items = self.list()
        if country:
            items = [item for item in items if item.get("country") == country]
        if category:
            items = [item for item in items if category in item.get("categories", [])]
        return items
