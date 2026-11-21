from __future__ import annotations

import asyncio
import io
from threading import Lock
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

from app.domains.incidents.router import analyze_incidents, export_results
from app.domains.suppliers.models import SupplierCreate, SupplierRateUpdate, SupplierStatusUpdate
from app.domains.suppliers.router import (
    create_supplier,
    delete_supplier,
    get_supplier,
    get_supplier_status_history,
    list_suppliers,
    update_rate,
    update_status,
)
from app.domains.suppliers.storage import SupplierStore

USER = {"id": "user-123", "role": "user"}
CSV_HEADER = (
    "incident_id,date,country,customer_type,tracking_number,carrier,category,description,"
    "status,customer_email,satisfaction_score\n"
)
CSV_ROW = "TRF-000001,2026-01-02,US,B2C,TRACK123456,UPS,LOST_PARCEL,Package missing,OPEN,fictional@example.com,\n"


@pytest.fixture
def supplier_store(tmp_path) -> SupplierStore:
    store = SupplierStore(str(tmp_path / "suppliers.json"))
    yield store
    store.close()


def sample_supplier(**changes) -> SupplierCreate:
    return SupplierCreate.model_validate({
        "name": "Fictional Carrier",
        "country": "USA",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 4.5,
        "currency": "USD",
        "status": "active",
        **changes,
    })


def test_supplier_crud_rate_and_status_history(supplier_store: SupplierStore) -> None:
    created = create_supplier(sample_supplier(), supplier_store, USER)
    assert created["name"] == "Fictional Carrier"
    assert list_suppliers(None, None, supplier_store, USER)[0]["id"] == created["id"]

    changed_rate = update_rate(created["id"], SupplierRateUpdate(rate_per_shipment=5.25), supplier_store, USER)
    assert changed_rate["rate_per_shipment"] == 5.25
    suspended = update_status(created["id"], SupplierStatusUpdate(status="suspended"), supplier_store, USER)
    assert suspended["status"] == "suspended"
    assert len(get_supplier_status_history(created["id"], supplier_store, USER)) == 1
    assert get_supplier(created["id"], supplier_store, USER)["id"] == created["id"]
    assert delete_supplier(created["id"], supplier_store, USER).status_code == 204


def test_supplier_boundary_and_invalid_values(supplier_store: SupplierStore) -> None:
    with pytest.raises(ValidationError):
        sample_supplier(rate_per_shipment=0)
    with pytest.raises(ValidationError):
        sample_supplier(name="   ")
    created = create_supplier(sample_supplier(), supplier_store, USER)
    unchanged = update_status(created["id"], SupplierStatusUpdate(status="active"), supplier_store, USER)
    assert unchanged["status"] == "active"
    assert get_supplier_status_history(created["id"], supplier_store, USER) == []


def test_supplier_missing_ids_fail_without_mutating_other_records(supplier_store: SupplierStore) -> None:
    with pytest.raises(HTTPException) as missing:
        get_supplier(999, supplier_store, USER)
    assert missing.value.status_code == 404
    with pytest.raises(HTTPException):
        update_rate(999, SupplierRateUpdate(rate_per_shipment=2), supplier_store, USER)
    with pytest.raises(HTTPException):
        update_status(999, SupplierStatusUpdate(status="suspended"), supplier_store, USER)
    with pytest.raises(HTTPException):
        get_supplier_status_history(999, supplier_store, USER)
    with pytest.raises(HTTPException):
        delete_supplier(999, supplier_store, USER)
    assert supplier_store.list() == []


def incident_request() -> SimpleNamespace:
    return SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(summary_lock=Lock(), summaries={})))


def test_incident_upload_aggregates_valid_row_and_keeps_results_per_user() -> None:
    request = incident_request()
    upload = UploadFile(filename="fictional.csv", file=io.BytesIO((CSV_HEADER + CSV_ROW).encode()))

    summary = asyncio.run(analyze_incidents(request, upload, USER))

    assert summary["total_records"] == 1
    assert summary["valid_records"] == 1
    assert request.app.state.summaries[USER["id"]] == summary


def test_incident_upload_rejects_empty_bad_headers_and_invalid_encoding() -> None:
    for content, filename in [(b"", "empty.csv"), (b"wrong,headers\n1,2\n", "bad.csv"), (b"\xff", "invalid.csv")]:
        upload = UploadFile(filename=filename, file=io.BytesIO(content))
        with pytest.raises(HTTPException) as error:
            asyncio.run(analyze_incidents(incident_request(), upload, USER))
        assert error.value.status_code == 400

    wrong_extension = UploadFile(filename="data.txt", file=io.BytesIO((CSV_HEADER + CSV_ROW).encode()))
    with pytest.raises(HTTPException) as error:
        asyncio.run(analyze_incidents(incident_request(), wrong_extension, USER))
    assert error.value.status_code == 415


def test_incident_export_requires_a_prior_analysis_and_uses_only_callers_data() -> None:
    request = incident_request()
    with pytest.raises(HTTPException) as error:
        export_results(request, USER)
    assert error.value.status_code == 404

    request.app.state.summaries[USER["id"]] = {
        "total_records": 1,
        "valid_records": 1,
        "invalid_records": 0,
        "invalid_breakdown": {},
        "by_category": {"LOST_PARCEL": 1, "DELAYED_DELIVERY": 0, "WRONG_ADDRESS": 0, "RETURN_REQUEST": 0, "DAMAGE": 0},
        "by_status": {"OPEN": 1, "CLOSED": 0, "DISCARDED": 0},
        "by_country": {"US": 1, "ES": 0},
        "satisfaction": {"scored_incidents": 0, "closed_incidents": 0, "average": None, "by_score": {str(i): 0 for i in range(1, 6)}},
    }
    response = export_results(request, USER)
    assert response.status_code == 200
    assert request.app.state.summaries[USER["id"]]["total_records"] == 1
    assert "fictional@example.com" not in str(request.app.state.summaries)
