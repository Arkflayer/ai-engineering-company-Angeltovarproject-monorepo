"""Incident models and TrackFlow business validation."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


VALID_TRANSITIONS: dict[IncidentStatus, list[IncidentStatus]] = {
    IncidentStatus.OPEN: [IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED],
    IncidentStatus.IN_PROGRESS: [IncidentStatus.RESOLVED, IncidentStatus.DISCARDED],
    IncidentStatus.RESOLVED: [],
    IncidentStatus.DISCARDED: [],
}


class Incident(BaseModel):
    """Internal model representing a stored incident."""
    model_config = ConfigDict(extra="forbid", use_enum_values=True)

    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    status: IncidentStatus = IncidentStatus.OPEN
    category: IncidentCategory
    origin: IncidentOrigin = IncidentOrigin.BRANCH
    branch: IncidentBranch
    country: str | None = Field(default=None, pattern=r"^(US|ES)$")
    customer_type: str | None = Field(default=None, pattern=r"^(B2B|B2C)$")
    tracking_number: str | None = Field(default=None, max_length=50)
    carrier: str | None = Field(default=None, max_length=50)
    customer_email: str | None = Field(default=None, max_length=200)
    satisfaction_score: int | None = Field(default=None, ge=1, le=5)
    reported_by: str | None = Field(default=None, max_length=100)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, title: str) -> str:
        stripped = title.strip()
        if not stripped:
            raise ValueError("El título no puede estar vacío.")
        return stripped

    @field_validator("satisfaction_score")
    @classmethod
    def score_requires_resolved(cls, score: int | None, info) -> int | None:
        if score is not None and info.data.get("status") != IncidentStatus.RESOLVED:
            raise ValueError("satisfaction_score solo puede establecerse en incidencias resueltas.")
        return score


class IncidentCreate(BaseModel):
    """Input model for creating a new incident via the form."""
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    category: IncidentCategory
    origin: IncidentOrigin = IncidentOrigin.BRANCH
    branch: IncidentBranch
    country: str | None = Field(default=None, pattern=r"^(US|ES)$")
    customer_type: str | None = Field(default=None, pattern=r"^(B2B|B2C)$")
    tracking_number: str | None = Field(default=None, max_length=50)
    carrier: str | None = Field(default=None, max_length=50)
    customer_email: str | None = Field(default=None, max_length=200)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, title: str) -> str:
        stripped = title.strip()
        if not stripped:
            raise ValueError("El título no puede estar vacío.")
        return stripped


class IncidentUpdate(BaseModel):
    """Input model for updating an existing incident."""
    model_config = ConfigDict(extra="forbid")

    status: IncidentStatus | None = None
    description: str | None = Field(default=None, max_length=2000)
    tracking_number: str | None = Field(default=None, max_length=50)
    carrier: str | None = Field(default=None, max_length=50)
    satisfaction_score: int | None = Field(default=None, ge=1, le=5)


class IncidentResponse(BaseModel):
    """Public response model for an incident (never includes internal fields)."""
    model_config = ConfigDict(use_enum_values=True)

    id: str
    title: str
    description: str
    status: str
    category: str
    origin: str
    branch: str
    country: str | None
    customer_type: str | None
    tracking_number: str | None
    carrier: str | None
    customer_email: str | None
    satisfaction_score: int | None
    reported_by: str | None
    created_at: str
    updated_at: str