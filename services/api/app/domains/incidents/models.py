"""Modelos de incidencias de TrackFlow con ciclo de vida, categorías y sedes."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentCategory(str, Enum):
    LOST_PARCEL = "lost_parcel"
    DELIVERY_FAILURE = "delivery_failure"
    INVENTORY_DISCREPANCY = "inventory_discrepancy"
    CARRIER_ISSUE = "carrier_issue"
    RETURNS_ISSUE = "returns_issue"
    WAREHOUSE_INCIDENT = "warehouse_incident"
    SYSTEM_FAILURE = "system_failure"
    CLIENT_COMPLAINT = "client_complaint"
    OTHER = "other"


class IncidentOrigin(str, Enum):
    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


class IncidentBranch(str, Enum):
    CENTRAL = "central"
    LA_WAREHOUSE = "la_warehouse"
    LA_OFFICE = "la_office"
    ZARAGOZA_WAREHOUSE = "zaragoza_warehouse"
    ZARAGOZA_OFFICE = "zaragoza_office"


BRANCH_DISPLAY: dict[IncidentBranch, dict[str, str]] = {
    IncidentBranch.CENTRAL: {"es": "Central", "en": "Central"},
    IncidentBranch.LA_WAREHOUSE: {"es": "Los Ángeles — Almacén", "en": "Los Angeles — Warehouse"},
    IncidentBranch.LA_OFFICE: {"es": "Los Ángeles — Oficina", "en": "Los Angeles — Office"},
    IncidentBranch.ZARAGOZA_WAREHOUSE: {"es": "Zaragoza — Almacén", "en": "Zaragoza — Warehouse"},
    IncidentBranch.ZARAGOZA_OFFICE: {"es": "Zaragoza — Oficina", "en": "Zaragoza — Office"},
}

CATEGORY_DISPLAY: dict[IncidentCategory, dict[str, str]] = {
    IncidentCategory.LOST_PARCEL: {"es": "Paquete extraviado", "en": "Lost parcel"},
    IncidentCategory.DELIVERY_FAILURE: {"es": "Fallo de entrega", "en": "Delivery failure"},
    IncidentCategory.INVENTORY_DISCREPANCY: {"es": "Discrepancia de inventario", "en": "Inventory discrepancy"},
    IncidentCategory.CARRIER_ISSUE: {"es": "Problema con transportista", "en": "Carrier issue"},
    IncidentCategory.RETURNS_ISSUE: {"es": "Problema de devolución", "en": "Returns issue"},
    IncidentCategory.WAREHOUSE_INCIDENT: {"es": "Incidente en almacén", "en": "Warehouse incident"},
    IncidentCategory.SYSTEM_FAILURE: {"es": "Fallo de sistema", "en": "System failure"},
    IncidentCategory.CLIENT_COMPLAINT: {"es": "Queja de cliente", "en": "Client complaint"},
    IncidentCategory.OTHER: {"es": "Otro", "en": "Other"},
}

STATUS_DISPLAY: dict[IncidentStatus, dict[str, str]] = {
    IncidentStatus.OPEN: {"es": "Abierta", "en": "Open"},
    IncidentStatus.IN_PROGRESS: {"es": "En progreso", "en": "In progress"},
    IncidentStatus.RESOLVED: {"es": "Resuelta", "en": "Resolved"},
    IncidentStatus.DISCARDED: {"es": "Descartada", "en": "Discarded"},
}

VALID_TRANSITIONS: dict[IncidentStatus, set[IncidentStatus]] = {
    IncidentStatus.OPEN: {IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED, IncidentStatus.DISCARDED},
    IncidentStatus.RESOLVED: set(),
    IncidentStatus.DISCARDED: set(),
}


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=5000)
    category: IncidentCategory
    origin: IncidentOrigin
    branch: IncidentBranch


class Incident(IncidentCreate):
    id: UUID = Field(default_factory=uuid4)
    status: IncidentStatus = IncidentStatus.OPEN
    reported_by: UUID | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IncidentStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: IncidentStatus


class IncidentFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: IncidentStatus | None = None
    category: IncidentCategory | None = None
    origin: IncidentOrigin | None = None
    branch: IncidentBranch | None = None