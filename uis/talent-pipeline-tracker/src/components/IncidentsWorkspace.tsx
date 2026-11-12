"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { apiBlob, apiRequest, ApiError, login } from "@/lib/api";
import type { IncidentSummary } from "@/lib/types";

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

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [authMessage, setAuthMessage] = useState("Inicia sesión con tu cuenta de TrackFlow para habilitar el análisis.");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [analysisError, setAnalysisError] = useState(false);

  const canAnalyze = Boolean(token && file && !busy);
  const canExport = Boolean(token && summary && !busy);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setAuthBusy(true);
    setAuthMessage("Verificando credenciales…");
    try {
      const session = await login(String(data.get("email") || ""), String(data.get("password") || ""));
      setToken(session.access_token);
      form.reset();
      setAuthMessage("Sesión iniciada. El token solo se conserva en esta página mientras esté abierta.");
      setAnalysisMessage(file ? "Archivo listo para analizar." : "Selecciona un CSV para habilitar el análisis.");
    } catch (error) {
      setAuthMessage(errorText(error, "No se pudo iniciar sesión."));
    } finally {
      setAuthBusy(false);
    }
  }

  function logout() {
    setToken("");
    setSummary(null);
    setAuthMessage("Sesión cerrada. Inicia sesión para analizar un archivo.");
    setAnalysisMessage("");
    setAnalysisError(false);
  }

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
      if (error instanceof ApiError && error.status === 401) {
        setToken("");
        setAuthMessage("La sesión caducó. Inicia sesión nuevamente.");
      }
      setAnalysisMessage(errorText(error, "No se pudo analizar el archivo."));
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
      if (error instanceof ApiError && error.status === 401) {
        setToken("");
        setSummary(null);
        setAuthMessage("La sesión caducó. Inicia sesión nuevamente.");
      }
      setAnalysisMessage(errorText(error, "No se pudo descargar el resultado."));
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
      <section className="page-heading"><div><p className="eyebrow">EXPERIENCIA DEL CLIENTE</p><h1>Análisis de incidencias</h1><p className="page-description">Carga un CSV para validar su calidad y consultar métricas agregadas.</p></div></section>
      <section className="incident-privacy" aria-label="Aviso de privacidad"><strong>Datos sensibles:</strong> el CSV se envía al servidor configurado para su análisis. Las filas de origen y los correos no se muestran ni se incluyen en la exportación. Usa solo un entorno autorizado.</section>

      <section className="content-card auth-card" aria-labelledby="incident-auth-title">
        <div className="card-heading"><div><h2 id="incident-auth-title">Acceso seguro</h2><p>Inicia sesión para analizar y exportar informes</p></div>{token && <button className="secondary-button" type="button" onClick={logout}>Cerrar sesión</button>}</div>
        {!token && <form className="login-form" onSubmit={handleLogin}>
          <label htmlFor="incident-login-email">Correo electrónico<input id="incident-login-email" name="email" type="email" autoComplete="username" required /></label>
          <label htmlFor="incident-login-password">Contraseña<input id="incident-login-password" name="password" type="password" autoComplete="current-password" required /></label>
          <button className="primary-button" type="submit" disabled={authBusy}>{authBusy ? "Verificando…" : "Iniciar sesión"}</button>
        </form>}
        <p className={`analysis-message${authMessage.toLowerCase().includes("no se pudo") ? " error" : ""}`} role="status" aria-live="polite">{authMessage}</p>
      </section>

      <section className="content-card upload-card" aria-labelledby="upload-title">
        <div className="card-heading"><div><h2 id="upload-title">Cargar reporte CSV</h2><p>Formato UTF-8 con encabezados de TrackFlow</p></div></div>
        <label className={`file-drop${dragging ? " dragging" : ""}`} htmlFor="csv-file" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
          <span className="upload-icon" aria-hidden="true">↑</span><strong>Selecciona un archivo CSV</strong><span>o arrástralo hasta aquí · máximo 25 MiB</span>
          <input id="csv-file" name="file" type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => selectFile(event.currentTarget.files?.[0])} />
        </label>
        <div className="upload-actions"><p className="file-name" aria-live="polite">{file?.name || "Ningún archivo seleccionado"}</p><button className="primary-button" type="button" onClick={() => void analyzeFile()} disabled={!canAnalyze}>{busy ? "Procesando…" : "Analizar archivo"}</button></div>
        <p className={`analysis-message${analysisError ? " error" : ""}`} role="status" aria-live="polite">{analysisMessage || (!token ? "Inicia sesión para analizar; el archivo se mantiene local hasta que pulses Analizar." : "Selecciona un CSV para habilitar el análisis.")}</p>
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
  );
}