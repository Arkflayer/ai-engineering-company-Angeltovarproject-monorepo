"""Endpoints para el gestor de incidencias de TrackFlow."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.auth import get_current_user
from app.domains.incidents.models import (
    BRANCH_DISPLAY,
    CATEGORY_DISPLAY,
    IncidentBranch,
    IncidentCategory,
    IncidentCreate,
    IncidentStatus,
    IncidentStatusUpdate,
    STATUS_DISPLAY,
)
from app.domains.incidents.storage import IncidentStore

router = APIRouter(prefix="/api/incidents", tags=["Gestor de incidencias"])


def get_incident_store(request: Request) -> IncidentStore:
    return request.app.state.incidents


@router.get("/summary")
def get_summary(
    store: IncidentStore = Depends(get_incident_store),
) -> dict:
    """Devuelve el resumen de incidencias (por estado, categoría, origen y sede)."""
    return store.summary()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    store: IncidentStore = Depends(get_incident_store),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Registra una nueva incidencia (requiere autenticación)."""
    incident = store.create(payload, reported_by=current_user.get("id"))
    return incident


@router.get("")
def list_incidents(
    status: IncidentStatus | None = None,
    category: IncidentCategory | None = None,
    branch: IncidentBranch | None = None,
    origin: IncidentOrigin | None = None,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> list[dict]:
    """Lista incidencias con filtros opcionales."""
    filters = {}
    if status:
        filters["status"] = status.value
    if category:
        filters["category"] = category.value
    if branch:
        filters["branch"] = branch.value
    if origin:
        filters["origin"] = origin.value
    return store.list(filters or None)


@router.get("/{incident_id}")
def get_incident(
    incident_id: str,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Obtiene una incidencia por ID (doc_id numérico o UUID)."""
    incident = store.get(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return incident


@router.patch("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    payload: IncidentStatusUpdate,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Actualiza el estado de una incidencia (transición válida)."""
    incident = store.update_status(incident_id, payload.status.value)
    if incident is None:
        raise HTTPException(
            status_code=400,
            detail="Transición de estado no válida o incidencia no encontrada.",
        )
    return incident


@router.post("/seed", status_code=200)
async def seed_incidents(
    request: Request,
    store: IncidentStore = Depends(get_incident_store),
    _user: dict = Depends(get_current_user),
) -> dict:
    """Carga las incidencias del CSV histórico al gestor."""
    import io
    from pathlib import Path

    csv_path = Path(__file__).resolve().parents[5] / "data" / "eval" / "incidents-trackflow.synthetic.csv"
    if not csv_path.is_file():
        raise HTTPException(status_code=404, detail="Archivo CSV de incidencias no encontrado.")
    with csv_path.open(encoding="utf-8", newline="") as f:
        result = store.seed_from_csv(io.StringIO(f.read()))
    return result


@router.get("/display/branches")
def get_branch_labels(lang: str = "es") -> dict[str, str]:
    """Devuelve las etiquetas de las sedes en el idioma indicado."""
    return {k.value: v.get(lang, v["es"]) for k, v in BRANCH_DISPLAY.items()}


@router.get("/display/categories")
def get_category_labels(lang: str = "es") -> dict[str, str]:
    """Devuelve las etiquetas de las categorías en el idioma indicado."""
    return {k.value: v.get(lang, v["es"]) for k, v in CATEGORY_DISPLAY.items()}


@router.get("/display/statuses")
def get_status_labels(lang: str = "es") -> dict[str, str]:
    """Devuelve las etiquetas de los estados en el idioma indicado."""
    return {k.value: v.get(lang, v["es"]) for k, v in STATUS_DISPLAY.items()}
