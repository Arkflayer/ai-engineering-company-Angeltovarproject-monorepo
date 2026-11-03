"""Endpoints autenticados para el análisis de incidencias."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.domains.incidents.analysis import CSVFormatError, analyze_csv, write_results_csv

router = APIRouter(prefix="/api/incidents", tags=["Análisis de incidencias"])
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


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
