"""Aplicación FastAPI de TrackFlow para analizar incidencias localmente."""
from __future__ import annotations

import csv
import io
import os
from contextlib import asynccontextmanager
from threading import Lock

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app.auth import get_current_user, router as auth_router
from app.domains.incidents.analysis import CSVFormatError, analyze_csv, write_results_csv
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
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


@app.get("/health")
def health() -> dict[str, str]:
    return {"estado": "correcto"}


@app.post("/api/incidents/analyze")
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


@app.get("/api/incidents/results/export")
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
        headers={"Content-Disposition": 'attachment; filename="resultados-analisis-incidencias.csv"'},
    )
