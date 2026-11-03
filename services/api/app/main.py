"""Aplicación FastAPI de TrackFlow para analizar incidencias localmente."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import router as auth_router
from app.domains.incidents.router import router as incidents_router
from app.domains.profiles import router as profiles_router
from app.domains.users import router as users_router
from app.security import get_settings
from app.storage import IdentityStore


@asynccontextmanager
async def lifespan(application: FastAPI):
    application.state.identity = IdentityStore(get_settings().db_path)
    application.state.summaries = {}
    application.state.summary_lock = Lock()
    try:
        yield
    finally:
        application.state.identity.close()
        application.state.summaries.clear()


app = FastAPI(title="Análisis de incidencias de TrackFlow", version="1.0.0", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(incidents_router)


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": [
            {"loc": error["loc"], "msg": error["msg"], "type": error["type"]}
            for error in exc.errors()
        ]},
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
