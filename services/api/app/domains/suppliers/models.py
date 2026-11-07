"""Supplier models and TrackFlow business validation."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class SupplierCountry(str, Enum):
    USA = "USA"
    SPAIN = "Spain"


class SupplierCurrency(str, Enum):
    USD = "USD"
    EUR = "EUR"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class SupplierCategory(str, Enum):
    CARRIER_LAST_MILE = "carrier_last_mile"
    CARRIER_INTERNATIONAL = "carrier_international"
    WAREHOUSE_SUPPLIES = "warehouse_supplies"
    PACKAGING_MATERIALS = "packaging_materials"
    REVERSE_LOGISTICS = "reverse_logistics"
    FLEET_MAINTENANCE = "fleet_maintenance"
    IT_AND_WMS_SOFTWARE = "it_and_wms_software"
    CLEANING_AND_FACILITIES = "cleaning_and_facilities"


PositiveRate = Annotated[float, Field(gt=0, allow_inf_nan=False)]


class SupplierInput(BaseModel):
    """Fields accepted when creating a supplier; system timestamps are excluded."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=160)
    country: SupplierCountry
    categories: list[SupplierCategory] = Field(min_length=1)
    rate_per_shipment: PositiveRate
    currency: SupplierCurrency
    status: SupplierStatus
    service_zone: str | None = Field(default=None, max_length=160)
    contact_email: EmailStr | None = None
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("El nombre no puede estar vacío.")
        return value.strip()

    @model_validator(mode="after")
    def currency_matches_country(self) -> SupplierInput:
        expected = SupplierCurrency.USD if self.country is SupplierCountry.USA else SupplierCurrency.EUR
        if self.currency is not expected:
            raise ValueError(f"La moneda para {self.country.value} debe ser {expected.value}.")
        return self


class SupplierCreate(SupplierInput):
    pass


class Supplier(SupplierInput):
    id: int
    updated_at: datetime


class SupplierRateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rate_per_shipment: PositiveRate


class SupplierStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: SupplierStatus


class SupplierStatusHistoryEntry(BaseModel):
    supplier_id: int
    previous_status: SupplierStatus
    status: SupplierStatus
    changed_at: datetime


def current_timestamp() -> datetime:
    return datetime.now(timezone.utc)
