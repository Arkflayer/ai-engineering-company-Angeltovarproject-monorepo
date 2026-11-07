"""Authenticated supplier directory endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.auth import get_current_user
from app.domains.suppliers.models import (
    Supplier,
    SupplierCategory,
    SupplierCountry,
    SupplierCreate,
    SupplierRateUpdate,
    SupplierStatus,
    SupplierStatusHistoryEntry,
    SupplierStatusUpdate,
)
from app.domains.suppliers.storage import SupplierStore

router = APIRouter(prefix="/suppliers", tags=["Directorio de proveedores"])


def get_supplier_store(request: Request) -> SupplierStore:
    return request.app.state.suppliers


@router.post("", response_model=Supplier, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreate,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    return store.create(payload)


@router.get("", response_model=list[Supplier])
def list_suppliers(
    country: SupplierCountry | None = None,
    category: SupplierCategory | None = None,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> list[dict]:
    return store.filter(country.value if country else None, category.value if category else None)


@router.get("/{supplier_id}", response_model=Supplier)
def get_supplier(
    supplier_id: int,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    supplier = store.get(supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return supplier


@router.patch("/{supplier_id}/rate", response_model=Supplier)
def update_rate(
    supplier_id: int,
    payload: SupplierRateUpdate,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    supplier = store.update_rate(supplier_id, payload.rate_per_shipment)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return supplier


@router.patch("/{supplier_id}/status", response_model=Supplier)
def update_status(
    supplier_id: int,
    payload: SupplierStatusUpdate,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    supplier = store.update_status(supplier_id, payload.status.value)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return supplier


@router.get("/{supplier_id}/status-history", response_model=list[SupplierStatusHistoryEntry])
def get_supplier_status_history(
    supplier_id: int,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> list[dict]:
    if store.get(supplier_id) is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return store.get_status_history(supplier_id)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    store: SupplierStore = Depends(get_supplier_store),
    _user: dict = Depends(get_current_user),
) -> Response:
    if not store.delete(supplier_id):
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
