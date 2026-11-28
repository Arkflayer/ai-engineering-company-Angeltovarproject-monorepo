"""Endpoints autenticados para la gestión centralizada de incidencias."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.domains.incidents.analysis import CSVFormatError, analyze_csv, write_results_csv
from app.domains.incidents.models import (
    IncidentCategory,
    IncidentCreate,
    IncidentResponse,
    IncidentStatus,
    IncidentBranch,
    IncidentUpdate,
)
from app.domains.incidents.storage import IncidentStore

router = APIRouter(prefix="/api/incidents", tags=["Gestión de incidencias"])
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def get_incident_store(request: Request) -> IncidentStore:
    return request.app.state.incidents


# ── CSV Analysis (existing) ─────────────────────────────────────────────


@router.post("/analyze")
async def analyze_incidents(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="Sube un archivo con extensión .csv.")
    try:
        content = await file.read(MAX_UPLOAD_BYTES + 1)
        if not content:
            raise HTTPException(status_code=400, detail="El archivo CSV está vacío.")
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="El archivo supera el límite de 25 MiB.")
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="El archivo debe estar codificado en UTF-8.") from exc
        if not text.strip():
            raise HTTPException(status_code=400, detail="El archivo CSV está vacío.")
        try:
            dialect = csv.Sniffer().sniff(text[:8192], delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel
        if dialect.delimiter != ",":
            raise HTTPException(status_code=400, detail="El CSV debe usar coma (,) como separador.")
        try:
            summary = await run_in_threadpool(analyze_csv, io.StringIO(text, newline=""))
        except CSVFormatError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        with request.app.state.summary_lock:
            request.app.state.summaries[current_user["id"]] = summary
        return summary
    finally:
        await file.close()


@router.get("/results/export")
def export_results(
    request: Request, current_user: dict = Depends(get_current_user)
) -> StreamingResponse:
    with request.app.state.summary_lock:
        summary = request.app.state.summaries.get(current_user["id"])
    if summary is None:
        raise HTTPException(status_code=404, detail="Todavía no hay un análisis para exportar.")
    output = io.StringIO(newline="")
    write_results_csv(summary, output)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="results.csv"'},
    )


# ── CRUD endpoints ──────────────────────────────────────────────────────


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    store: IncidentStore = Depends(get_incident_store),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Register a new incident."""
    return store.create(payload, reported_by=current_user.get("email"))


@router.get("", response_model=list[IncidentResponse])
def list_incidents(
    status: IncidentStatus | None = Query(None, description="Filtrar por estado"),
    origin: str | None = Query(None, description="Filtrar por origen"),
    category: IncidentCategory | None = Query(None, description="Filtrar por categoría"),
    country: str | None = Query(None, pattern="^(US|ES)$", description="Filtrar por país"),
    branch: IncidentBranch | None = Query(None, description="Filtrar por sucursal"),
    date_from: str | None = Query(None, description="Fecha inicial (ISO, inclusive)"),
    date_to: str | None = Query(None, description="Fecha final (ISO, inclusive)"),
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> list[dict]:
    """List incidents with optional filters."""
    return store.list(
        status=status,
        origin=origin,
        category=category,
        country=country,
        branch=branch,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/summary")
def get_summary(
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Return aggregated counts grouped by status, category, origin, and branch."""
    return store.summary()


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    payload: IncidentUpdate,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Update only the status of an incident. Validates lifecycle transitions."""
    if payload.status is None:
        raise HTTPException(status_code=400, detail="El campo 'status' es obligatorio.")
    if any(getattr(payload, f) is not None for f in ("description", "tracking_number", "carrier", "satisfaction_score")):
        raise HTTPException(status_code=400, detail="Este endpoint solo permite actualizar el estado.")
    try:
        incident = store.update(incident_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return incident


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: str,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Fetch a single incident by its UUID."""
    incident = store.get(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    payload: IncidentUpdate,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Update an incident (status, description, tracking, carrier, score)."""
    try:
        incident = store.update(incident_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return incident


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: str,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> Response:
    """Delete an incident by UUID."""
    if not store.delete(incident_id):
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
