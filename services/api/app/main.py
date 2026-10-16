"""Aplicación FastAPI de TrackFlow para analizar incidencias localmente."""
from __future__ import annotations

import csv
import io
import os
from threading import Lock
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.domains.incidents.analysis import CSVFormatError, analyze_csv, write_results_csv

app = FastAPI(title="Análisis de incidencias de TrackFlow", version="1.0.0")
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
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
_last_summary: Optional[dict] = None
_summary_lock = Lock()


@app.get("/health")
def health() -> dict[str, str]:
    return {"estado": "correcto"}


@app.post("/api/incidents/analyze")
async def analyze_incidents(file: UploadFile = File(...)) -> dict:
    global _last_summary
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
        with _summary_lock:
            _last_summary = summary
        return summary
    finally:
        await file.close()


@app.get("/api/incidents/results/export")
def export_results() -> StreamingResponse:
    with _summary_lock:
        summary = _last_summary
    if summary is None:
        raise HTTPException(status_code=404, detail="Todavía no hay un análisis para exportar.")
    output = io.StringIO(newline="")
    write_results_csv(summary, output)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="resultados-analisis-incidencias.csv"'},
    )
