"""Aplicación FastAPI de TrackFlow para analizar incidencias localmente."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.auth import router as auth_router
from app.domains.incidents.router import router as incidents_router
from app.domains.incidents.storage import IncidentStore
from app.domains.profiles import router as profiles_router
from app.domains.suppliers.router import router as suppliers_router
from app.domains.suppliers.storage import SupplierStore
from app.domains.users import router as users_router
from app.security import get_settings
from app.storage import IdentityStore


@asynccontextmanager
async def lifespan(application: FastAPI):
    application.state.identity = IdentityStore(get_settings().db_path)
    application.state.suppliers = SupplierStore(get_settings().supplier_db_path)
    application.state.incidents = IncidentStore(get_settings().incidents_db_path)
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


@app.middleware("http")
async def add_charset_header(request, call_next):
    """Asegura que todas las respuestas JSON incluyan charset=utf-8."""
    response: Response = await call_next(request)
    content_type = response.headers.get("content-type", "")
    if content_type == "application/json" and "charset" not in content_type:
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(suppliers_router)
app.include_router(incidents_router)


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    field_errors = {}
    for error in errors:
        loc = error.get("loc", [])
        field = str(loc[-1]) if loc else "body"
        msg = error.get("msg", "Valor no válido.")
        if error.get("type") == "missing":
            msg = "Este campo es obligatorio."
        elif error.get("type") == "extra_forbidden":
            msg = f"Valor no permitido: '{error.get('input', '')}'"
        field_errors[field] = msg
    return JSONResponse(
        status_code=400,
        content={"detail": field_errors},
    )


@app.exception_handler(Exception)
async def generic_error(request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Intente nuevamente."},
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
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"estado": "correcto"}
