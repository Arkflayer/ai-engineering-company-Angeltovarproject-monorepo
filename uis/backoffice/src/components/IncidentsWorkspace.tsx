"use client";

import { useState, useEffect, useCallback, type DragEvent } from "react";
import { apiBlob, apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Incident, IncidentSummary, IncidentAggSummary } from "@/lib/types";
import IncidentForm from "./IncidentForm";
import IncidentList from "./IncidentList";
import IncidentDetail from "./IncidentDetail";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const valueNames: Record<string, string> = {
  LOST_PARCEL: "Paquete perdido",
  DELAYED_DELIVERY: "Entrega retrasada",
  WRONG_ADDRESS: "Dirección incorrecta",
  RETURN_REQUEST: "Solicitud de devolución",
  DAMAGE: "Daño en el paquete",
  OPEN: "Abierta",
  CLOSED: "Cerrada",
  DISCARDED: "Descartada",
  US: "Estados Unidos",
  ES: "España",
};

function errorText(_error: unknown, fallback: string) {
  return fallback;
}

function Breakdown({ title, description, values, total }: {
  title: string;
  description: string;
  values: [string, string][];
  total?: number;
}) {
  return (
    <section className="content-card breakdown-card" aria-label={title}>
      <div className="card-heading"><div><h2>{title}</h2><p>{description}</p></div></div>
      <div className="breakdown-list">
        {values.length ? values.map(([label, value]) => {
          const number = Number(value);
          const percentage = total && Number.isFinite(number) ? `${(number * 100 / total).toFixed(1)}%` : "";
          return <div className="breakdown-row" key={label}><span>{label}</span><strong>{value}{percentage && <span>{percentage}</span>}</strong></div>;
        }) : <p className="empty-breakdown">Sin valores para mostrar.</p>}
      </div>
    </section>
  );
}

export default function IncidentsWorkspace() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [analysisError, setAnalysisError] = useState(false);
  const [tab, setTab] = useState<"analisis" | "gestion">("gestion");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aggSummary, setAggSummary] = useState<IncidentAggSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const loadSummary = useCallback(async () => {
    if (!token) return;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const data = await apiRequest<IncidentAggSummary>("/api/incidents/summary", token);
      setAggSummary(data);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "No se pudo cargar el resumen.");
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadSummary(); }, [loadSummary, refreshKey]);

  const canAnalyze = Boolean(token && file && !busy);
  const canExport = Boolean(token && summary && !busy);


  function selectFile(nextFile: File | undefined) {
    if (busy) return;
    setSummary(null);
    setAnalysisError(false);
    if (!nextFile) {
      setFile(null);
      setAnalysisMessage("");
      return;
    }
    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setAnalysisMessage("Selecciona un archivo con extensión .csv.");
      setAnalysisError(true);
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setAnalysisMessage("El archivo supera el límite de 25 MiB.");
      setAnalysisError(true);
      return;
    }
    setFile(nextFile);
    setAnalysisMessage(token ? "Archivo listo para analizar." : "Inicia sesión para habilitar el análisis.");
    setAnalysisError(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function analyzeFile() {
    if (!token || !file) {
      setAnalysisMessage(!token ? "Inicia sesión antes de analizar un archivo." : "Selecciona un CSV antes de continuar.");
      setAnalysisError(true);
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    setSummary(null);
    setAnalysisMessage("Analizando archivo…");
    setAnalysisError(false);
    try {
      const result = await apiRequest<IncidentSummary>("/api/incidents/analyze", token, { method: "POST", body });
      setSummary(result);
      setAnalysisMessage("Análisis completado. Los datos se muestran de forma agregada.");
    } catch (error) {
      setAnalysisMessage(errorText(error, "No se pudo analizar el archivo. Comprueba el CSV e inténtalo de nuevo."));
      setAnalysisError(true);
    } finally {
      setBusy(false);
    }
  }

  async function exportResults() {
    if (!token || !summary) return;
    setBusy(true);
    try {
      const blob = await apiBlob("/api/incidents/results/export", token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "results.csv";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAnalysisMessage("CSV agregado descargado.");
      setAnalysisError(false);
    } catch (error) {
      setAnalysisMessage(errorText(error, "No se pudo descargar el resultado. Inténtalo de nuevo."));
      setAnalysisError(true);
    } finally {
      setBusy(false);
    }
  }

  const summaryMetrics = summary ? [
    ["Registros procesados", String(summary.total_records), "Total del archivo"],
    ["Registros válidos", String(summary.valid_records), "Incluidos en métricas"],
    ["Registros inválidos", String(summary.invalid_records), "Excluidos del análisis"],
    ["Satisfacción media", summary.satisfaction.average === null ? "No disponible" : `${summary.satisfaction.average.toFixed(2)} / 5`, `${summary.satisfaction.scored_incidents} puntuaciones`],
  ] : [];

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">TrackFlow <span aria-hidden="true">/</span> Experiencia del cliente <span aria-hidden="true">/</span> Incidencias</div>
        <span className="status-pill"><span aria-hidden="true" /> Herramienta interna</span>
      </header>
      <section className="page-heading"><div><p className="eyebrow">EXPERIENCIA DEL CLIENTE</p><h1>Gestor de incidencias</h1><p className="page-description">Centraliza, consulta y analiza las incidencias de la operativa.</p></div></section>

      <div className="tab-bar" role="tablist" aria-label="Secciones del gestor">
        <button className={`tab${tab === "gestion" ? " active" : ""}`} role="tab" aria-selected={tab === "gestion"} onClick={() => { setTab("gestion"); setSelectedIncident(null); }}>
          Gestión
        </button>
        <button className={`tab${tab === "analisis" ? " active" : ""}`} role="tab" aria-selected={tab === "analisis"} onClick={() => setTab("analisis")}>
          Análisis CSV
        </button>
      </div>

      {tab === "gestion" && (
        <>
          {summaryError && <div className="analysis-message error" role="alert">{summaryError}</div>}
          {aggSummary && !summaryError && (
            <section className="content-card summary-panel" aria-labelledby="summary-title">
              <div className="card-heading">
                <div>
                  <h2 id="summary-title">Resumen</h2>
                  <p>{summaryLoading ? "Actualizando…" : `${aggSummary.total} incidencia(s) en total`}</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => void loadSummary()} disabled={summaryLoading}>
                  {summaryLoading ? "…" : "Actualizar"}
                </button>
              </div>
              <div className="summary-grid">
                <div className="summary-card">
                  <h3>Por estado</h3>
                  <p className="summary-total">{aggSummary.total}</p>
                  <ul className="summary-breakdown">
                    {Object.entries(aggSummary.by_status).map(([key, count]) => (
                      <li key={key}><span>{key === "open" ? "Abierta" : key === "in_progress" ? "En curso" : key === "resolved" ? "Resuelta" : key === "discarded" ? "Descartada" : key}</span><span className="summary-count">{count}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="summary-card">
                  <h3>Por categoría</h3>
                  <p className="summary-total">{aggSummary.total}</p>
                  <ul className="summary-breakdown">
                    {Object.entries(aggSummary.by_category).map(([key, count]) => (
                      <li key={key}><span>{key === "lost_parcel" ? "Paquete perdido" : key === "delivery_failure" ? "Fallo de entrega" : key === "inventory_discrepancy" ? "Discrepancia inventario" : key === "carrier_issue" ? "Problema transportista" : key === "returns_issue" ? "Devolución" : key === "warehouse_incident" ? "Incidente almacén" : key === "system_failure" ? "Fallo del sistema" : key === "client_complaint" ? "Reclamación cliente" : key === "other" ? "Otro" : key}</span><span className="summary-count">{count}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="summary-card">
                  <h3>Por sucursal</h3>
                  <p className="summary-total">{aggSummary.total}</p>
                  <ul className="summary-breakdown">
                    {Object.entries(aggSummary.by_branch).map(([key, count]) => (
                      <li key={key}><span>{key === "central" ? "Central" : key === "la_warehouse" ? "LA — Almacén" : key === "la_office" ? "LA — Oficina" : key === "zaragoza_warehouse" ? "Zaragoza — Almacén" : key === "zaragoza_office" ? "Zaragoza — Oficina" : key}</span><span className="summary-count">{count}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="summary-card">
                  <h3>Por origen</h3>
                  <p className="summary-total">{aggSummary.total}</p>
                  <ul className="summary-breakdown">
                    {Object.entries(aggSummary.by_origin).map(([key, count]) => (
                      <li key={key}><span>{key === "customer" ? "Cliente" : key === "branch" ? "Sucursal" : key === "internal" ? "Interno" : key}</span><span className="summary-count">{count}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
          <div className="incident-crud-layout">
          <div className="incident-crud-sidebar">
            <IncidentForm onCreated={() => { setRefreshKey((k) => k + 1); }} />
          </div>
          <div className="incident-crud-main">
            {selectedIncident ? (
              <IncidentDetail
                incident={selectedIncident}
                onUpdated={(updated) => setSelectedIncident(updated)}
                onDeleted={() => { setSelectedIncident(null); setRefreshKey((k) => k + 1); }}
                onBack={() => setSelectedIncident(null)}
              />
            ) : (
              <IncidentList onSelect={setSelectedIncident} refreshKey={refreshKey} />
            )}
          </div>
        </div>
      </>)
    }

      {tab === "analisis" && (
        <>
          <section className="content-card upload-card" aria-labelledby="upload-title">
            <div className="card-heading"><div><h2 id="upload-title">Cargar reporte CSV</h2><p>Formato UTF-8 con encabezados de TrackFlow</p></div></div>
            <label className={`file-drop${dragging ? " dragging" : ""}`} htmlFor="csv-file" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
              <span className="upload-icon" aria-hidden="true">↑</span><strong>Selecciona un archivo CSV</strong><span>o arrástralo hasta aquí · máximo 25 MiB</span>
              <input id="csv-file" name="file" type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => selectFile(event.currentTarget.files?.[0])} />
            </label>
            <div className="upload-actions"><p className="file-name" aria-live="polite">{file?.name || "Ningún archivo seleccionado"}</p><button className="primary-button" type="button" onClick={() => void analyzeFile()} disabled={!canAnalyze}>{busy ? "Procesando…" : "Analizar archivo"}</button></div>
            <div className={`analysis-message${analysisError ? " error" : ""}`} role={analysisError ? "alert" : "status"} aria-live="polite"><p>{analysisMessage || (!token ? "Inicia sesión para analizar; el archivo se mantiene local hasta que pulses Analizar." : "Selecciona un CSV para habilitar el análisis.")}</p>{analysisError && analysisMessage.startsWith("No se pudo") && <button className="secondary-button" type="button" onClick={() => summary ? void exportResults() : void analyzeFile()} disabled={busy}>{summary ? "Reintentar descarga" : "Reintentar análisis"}</button>}</div>
          </section>

          {summary && <section className="results-section" aria-labelledby="results-title">
            <div className="results-heading"><div><p className="eyebrow">RESULTADO DEL ARCHIVO</p><h2 id="results-title">Resumen del análisis</h2><p className="page-description">Archivo analizado: {file?.name}</p></div><button className="secondary-button" type="button" onClick={() => void exportResults()} disabled={!canExport}>{busy ? "Preparando…" : "Descargar CSV agregado"}</button></div>
            <div className={`invalid-notice${summary.invalid_records ? " has-invalid" : ""}`} role="status">{summary.invalid_records ? `Se encontraron ${summary.invalid_records} registros inválidos o incompletos. Se excluyeron del análisis principal; consulta el desglose por regla.` : "No se encontraron registros inválidos."}</div>
            <div className="metrics-grid" aria-label="Métricas generales">{summaryMetrics.map(([title, value, foot]) => <article className="metric-card" key={title}><div className="metric-top">{title}</div><p className="metric-value metric-value-small">{value}</p><p className="metric-foot">{foot}</p></article>)}</div>
            <div className="incident-breakdowns">
              <Breakdown title="Por categoría" description="Solo registros válidos" values={Object.entries(summary.by_category).map(([key, count]) => [valueNames[key] || key, String(count)])} total={summary.valid_records} />
              <Breakdown title="Por estado" description="Solo registros válidos" values={Object.entries(summary.by_status).map(([key, count]) => [valueNames[key] || key, String(count)])} total={summary.valid_records} />
              <Breakdown title="Por país" description="Solo registros válidos" values={Object.entries(summary.by_country).map(([key, count]) => [valueNames[key] || key, String(count)])} total={summary.valid_records} />
              <Breakdown title="Satisfacción" description="Incidencias cerradas con puntuación válida" values={[["Promedio (escala 1–5)", summary.satisfaction.average === null ? "No disponible" : `${summary.satisfaction.average.toFixed(2)} / 5`], ["Puntuaciones registradas", `${summary.satisfaction.scored_incidents} de ${summary.satisfaction.closed_incidents} cerrados`], ...Object.entries(summary.satisfaction.by_score).map(([score, count]): [string, string] => [`Puntuación ${score}`, String(count)])]} />
              <Breakdown title="Registros inválidos" description="Excluidos de las métricas principales" values={Object.entries(summary.invalid_breakdown).map(([key, count]) => [summary.invalid_labels[key] || key, String(count)])} />
            </div>
          </section>}
        </>
      )}
    </>
  );
}
