"""Aplicación FastAPI de TrackFlow para analizar incidencias localmente."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import router as auth_router
from app.domains.incidents.router import router as incidents_router
from app.domains.incidents.storage import IncidentStore
from app.domains.profiles import router as profiles_router
from app.domains.suppliers.router import router as suppliers_router
from app.domains.suppliers.storage import SupplierStore
from app.domains.users import router as users_router
from app.security import get_incident_db_path, get_settings
from app.storage import IdentityStore


@asynccontextmanager
async def lifespan(application: FastAPI):
    application.state.identity = IdentityStore(get_settings().db_path)
    application.state.suppliers = SupplierStore(get_settings().supplier_db_path)
    application.state.incidents = IncidentStore(get_incident_db_path())
    application.state.summaries = {}
    application.state.summary_lock = Lock()
    try:
        yield
    finally:
        application.state.identity.close()
        application.state.suppliers.close()
        application.state.incidents.close()
        application.state.summaries.clear()


app = FastAPI(title="Análisis de incidencias de TrackFlow", version="1.0.0", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(suppliers_router)
app.include_router(incidents_router)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Validation errors return 400 with field-level messages in clear language."""
    field_errors: dict[str, str] = {}
    field_labels: dict[str, str] = {
        "title": "El título es obligatorio (mín. 1 carácter, máx. 120).",
        "description": "La descripción es obligatoria (mín. 1 carácter, máx. 2000).",
        "category": "Selecciona una categoría válida.",
        "branch": "Selecciona una sucursal válida.",
        "origin": "Selecciona un origen válido.",
        "country": "El país debe ser US o ES.",
        "customer_type": "El tipo de cliente debe ser B2B o B2C.",
        "tracking_number": "El número de seguimiento no puede superar 50 caracteres.",
        "carrier": "El transportista no puede superar 50 caracteres.",
        "customer_email": "Introduce un correo electrónico válido (máx. 200 caracteres).",
        "status": "Estado no válido.",
        "satisfaction_score": "La puntuación debe estar entre 1 y 5.",
        "email": "Introduce un correo electrónico válido.",
        "password": "La contraseña debe tener al menos 8 caracteres.",
        "name": "El nombre es obligatorio.",
    }
    for error in exc.errors():
        field = str(error.get("loc", ["body"])[-1]) if error.get("loc") else "body"
        msg = field_labels.get(field, error.get("msg", "Valor no válido."))
        field_errors[field] = msg
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Revisa los campos señalados.",
            "field_errors": field_errors,
        },
    )


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    """Unhandled exceptions return 500 with a generic message — never the stack trace."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrió un error inesperado. Inténtalo de nuevo más tarde."},
    )


allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "TRACKFLOW_UI_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"estado": "correcto"}
