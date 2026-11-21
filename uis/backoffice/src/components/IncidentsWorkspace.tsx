"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  TrackFlowIncident,
  IncidentCreatePayload,
  IncidentManagerSummary,
  IncidentStatus,
  IncidentCategory,
  IncidentOrigin,
  IncidentBranch,
} from "@/lib/types";

import { useLang, type Lang } from "@/lib/lang";

const LOCALE: Record<string, { es: string; en: string }> = {
  title:                { es: "Gestor de incidencias", en: "Incident manager" },
  subtitle:             { es: "Registra, consulta y da seguimiento a las incidencias operativas de TrackFlow.", en: "Register, view, and track TrackFlow operational incidents." },
  operations:           { es: "Operaciones", en: "Operations" },
  internalTool:         { es: "Herramienta interna", en: "Internal tool" },
  newIncident:          { es: "Nueva incidencia", en: "New incident" },
  dashboard:            { es: "Panel de resumen", en: "Summary dashboard" },
  incidentList:         { es: "Incidencias recientes", en: "Recent incidents" },
  submit:               { es: "Registrar incidencia", en: "Report incident" },
  sending:              { es: "Registrando…", en: "Sending…" },
  required:             { es: "Campo obligatorio", en: "Required field" },
  tooShort:             { es: "Describe la incidencia con más detalle", en: "Describe the incident in more detail" },
  success:              { es: "Incidencia registrada correctamente.", en: "Incident reported successfully." },
  error:                { es: "No se pudo registrar la incidencia.", en: "Could not report the incident." },
  loading:              { es: "Cargando…", en: "Loading…" },
  total:                { es: "Total", en: "Total" },
  open:                 { es: "Abiertas", en: "Open" },
  inProgress:           { es: "En progreso", en: "In progress" },
  resolved:             { es: "Resueltas", en: "Resolved" },
  discarded:            { es: "Descartadas", en: "Discarded" },
  seed:                 { es: "Cargar histórico CSV", en: "Load CSV history" },
  seeding:              { es: "Cargando…", en: "Loading…" },
  seedResult:           { es: "Histórico cargado: {inserted} insertadas, {skipped} omitidas.", en: "History loaded: {inserted} inserted, {skipped} skipped." },
  seedSuccess:          { es: "Histórico cargado exitosamente", en: "History loaded successfully" },
  seedError:            { es: "Error al cargar el histórico", en: "Error loading history" },
  updateStatus:         { es: "Cambiar estado", en: "Change status" },
  statusUpdated:        { es: "Estado actualizado", en: "Status updated" },
  statusError:          { es: "No se pudo actualizar el estado", en: "Could not update status" },
  loadingIncidents:     { es: "Cargando incidencias…", en: "Loading incidents…" },
  filter:               { es: "Filtrar", en: "Filter" },
  all:                  { es: "Todas", en: "All" },
  noResults:            { es: "No hay incidencias que coincidan con los filtros.", en: "No incidents match the applied filters." },
  retry:                { es: "Reintentar", en: "Retry" },
  branchHighlight:      { es: "Estás reportando desde una sede. La sede debe indicar tu ubicación actual.", en: "You are reporting from a branch. Select the branch matching your location." },
  status:               { es: "Estado", en: "Status" },
  origin:               { es: "Origen", en: "Origin" },
  branch:               { es: "Sede", en: "Branch" },
  /* Form labels */
  titleField:           { es: "Título", en: "Title" },
  titlePlaceholder:     { es: "Resume la incidencia en pocas palabras", en: "Summarize the incident briefly" },
  description:          { es: "Descripción", en: "Description" },
  descriptionPlaceholder: { es: "Describe qué ocurrió, cuándo y dónde", en: "Describe what happened, when, and where" },
  category:             { es: "Categoría", en: "Category" },
  originField:          { es: "Origen", en: "Origin" },
  branchField:          { es: "Sede", en: "Branch" },
  /* Table headers */
  tableTitle:           { es: "Título", en: "Title" },
  tableCategory:        { es: "Categoría", en: "Category" },
  tableOrigin:          { es: "Origen", en: "Origin" },
  tableBranch:          { es: "Sede", en: "Branch" },
  tableStatus:          { es: "Estado", en: "Status" },
  tableAction:          { es: "Acción", en: "Action" },
  final:                { es: "Final", en: "Final" },
  noIncidents:          { es: "No hay incidencias registradas aún.", en: "No incidents registered yet." },
  /* Modal detail labels */
  detailCategory:       { es: "Categoría", en: "Category" },
  detailOrigin:         { es: "Origen", en: "Origin" },
  detailBranch:         { es: "Sede", en: "Branch" },
  detailStatus:         { es: "Estado", en: "Status" },
  detailCreated:        { es: "Creada", en: "Created" },
  detailUpdated:        { es: "Actualizada", en: "Updated" },
};

function t(key: string, lang: Lang): string {
  return LOCALE[key]?.[lang] ?? key;
}

/** Traduce títulos de incidencias que vienen del backend en español */
function translateTitle(title: string, lang: Lang): string {
  if (lang === "es") return title;
  // "Incidencia sintética NNN" -> "Synthetic incident NNN"
  const synthMatch = title.match(/^Incidencia sintética (\d+)$/);
  if (synthMatch) return `Synthetic incident ${synthMatch[1]}`;
  // "Incidencia sintética NNN – descripción" -> "Synthetic incident NNN – description"
  const synthWithDesc = title.match(/^Incidencia sintética (\d+) – (.+)$/);
  if (synthWithDesc) return `Synthetic incident ${synthWithDesc[1]} – ${synthWithDesc[2]}`;
  // "Incidencia NNN" -> "Incident NNN"
  const incMatch = title.match(/^Incidencia (\d+)$/);
  if (incMatch) return `Incident ${incMatch[1]}`;
  return title;
}

/* ───── Constantes de dominio ───── */

const CATEGORIES: IncidentCategory[] = [
  "lost_parcel", "delivery_failure", "inventory_discrepancy", "carrier_issue",
  "returns_issue", "warehouse_incident", "system_failure", "client_complaint", "other",
];
const ORIGINS: IncidentOrigin[] = ["customer", "branch", "internal"];
const BRANCHES: IncidentBranch[] = [
  "central", "la_warehouse", "la_office", "zaragoza_warehouse", "zaragoza_office",
];

const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
  lost_parcel:            { es: "Paquete extraviado", en: "Lost parcel" },
  delivery_failure:       { es: "Fallo de entrega", en: "Delivery failure" },
  inventory_discrepancy:  { es: "Discrepancia de inventario", en: "Inventory discrepancy" },
  carrier_issue:          { es: "Problema con transportista", en: "Carrier issue" },
  returns_issue:          { es: "Problema de devolución", en: "Returns issue" },
  warehouse_incident:     { es: "Incidente en almacén", en: "Warehouse incident" },
  system_failure:         { es: "Fallo de sistema", en: "System failure" },
  client_complaint:       { es: "Queja de cliente", en: "Client complaint" },
  other:                  { es: "Otro", en: "Other" },
};

const ORIGIN_LABELS: Record<string, { es: string; en: string }> = {
  customer: { es: "Cliente", en: "Customer" },
  branch:   { es: "Sede TrackFlow", en: "TrackFlow branch" },
  internal: { es: "Interna", en: "Internal" },
};

const BRANCH_LABELS: Record<string, { es: string; en: string }> = {
  central:            { es: "Central", en: "Central" },
  la_warehouse:       { es: "Los Ángeles — Almacén", en: "Los Angeles — Warehouse" },
  la_office:          { es: "Los Ángeles — Oficina", en: "Los Angeles — Office" },
  zaragoza_warehouse: { es: "Zaragoza — Almacén", en: "Zaragoza — Warehouse" },
  zaragoza_office:    { es: "Zaragoza — Oficina", en: "Zaragoza — Office" },
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  open:        { es: "Abierta", en: "Open" },
  in_progress: { es: "En progreso", en: "In progress" },
  resolved:    { es: "Resuelta", en: "Resolved" },
  discarded:   { es: "Descartada", en: "Discarded" },
};

const STATUS_BADGE: Record<string, string> = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved",
  discarded: "discarded",
};

const VALID_TRANSITIONS: Record<IncidentStatus, (IncidentStatus | undefined)[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

/* ───── Helpers ───── */

function label(
  map: Record<string, { es: string; en: string }>,
  value: string,
  lang: Lang,
): string {
  return map[value]?.[lang] ?? value;
}

/* ───── Panel de resumen ───── */

function SummaryCards({ summary, lang }: { summary: IncidentManagerSummary; lang: Lang }) {
  const rows: [string, number, string][] = [
    [t("open", lang), summary.by_status.open ?? 0, "badge-open"],
    [t("inProgress", lang), summary.by_status.in_progress ?? 0, "badge-progress"],
    [t("resolved", lang), summary.by_status.resolved ?? 0, "badge-resolved"],
    [t("discarded", lang), summary.by_status.discarded ?? 0, "badge-discarded"],
  ];

  return (
    <div className="incident-summary-grid">
      <article className="metric-card">
        <div className="metric-top">{t("total", lang)}</div>
        <p className="metric-value">{String(summary.total)}</p>
      </article>
      {rows.map(([labelText, count, badge]) => (
        <article className={`metric-card ${badge}`} key={labelText}>
          <div className="metric-top">{labelText}</div>
          <p className="metric-value">{String(count)}</p>
        </article>
      ))}
    </div>
  );
}

/* ───── Formulario de nueva incidencia ───── */

function IncidentForm({ lang, token, onCreated }: { lang: Lang; token: string; onCreated: () => void }) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<IncidentCategory | "">("");
  const [origin, setOrigin] = useState<IncidentOrigin | "">("");
  const [branch, setBranch] = useState<IncidentBranch | "">("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearFieldError(field: string) {
    const next = { ...fieldErrors };
    delete next[field];
    setFieldErrors(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!token) {
      setMessage("Inicia sesión para registrar incidencias.");
      setIsError(true);
      return;
    }
    if (!category || !origin || !branch) {
      setMessage(t("required", lang));
      setIsError(true);
      return;
    }
    if (title.trim().length < 2) {
      setMessage(t("tooShort", lang));
      setIsError(true);
      return;
    }
    if (description.trim().length < 5) {
      setMessage(t("tooShort", lang));
      setIsError(true);
      return;
    }

    setBusy(true);
    setMessage("");
    setFieldErrors({});
    try {
      const payload: IncidentCreatePayload = {
        title: title.trim(),
        description: description.trim(),
        category: category as IncidentCategory,
        origin: origin as IncidentOrigin,
        branch: branch as IncidentBranch,
      };
      await apiRequest("/api/incidents", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(t("success", lang));
      setIsError(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setOrigin("");
      setBranch("");
      onCreated();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const parsedFieldErrors: Record<string, string> = {};
      let parsed = false;
      try {
        const parsedBody = JSON.parse(raw);
              if (typeof parsedBody?.detail === "object" && !Array.isArray(parsedBody.detail)) {
                // Nuevo formato: {"detail": {"campo": "mensaje"}}
                for (const [field, msg] of Object.entries(parsedBody.detail)) {
                  if (typeof msg === "string") {
                    parsedFieldErrors[field] = msg;
                  }
                }
                parsed = Object.keys(parsedFieldErrors).length > 0;
              } else if (Array.isArray(parsedBody?.detail)) {
          for (const d of parsedBody.detail) {
            if (d.loc && d.msg) {
              const locArr = d.loc as (string | number)[];
              const field = locArr.length >= 2 ? String(locArr[locArr.length - 1]) : "body";
              parsedFieldErrors[field] = d.msg;
            }
          }
          parsed = Object.keys(parsedFieldErrors).length > 0;
        } else if (typeof parsedBody?.detail === "string") {
          setMessage(parsedBody.detail);
          setIsError(true);
          parsed = true;
        }
      } catch {
        // not JSON
      }
      if (!parsed) {
        setMessage(raw.length < 120 ? raw : t("error", lang));
        setIsError(true);
      } else if (Object.keys(parsedFieldErrors).length > 0) {
        setFieldErrors(parsedFieldErrors);
      } else if (!message) {
        setMessage(t("error", lang));
        setIsError(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const isBranchOrigin = origin === "branch";

  return (
    <form className="incident-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      {isBranchOrigin && (
        <div className="branch-highlight" role="status">
          <span className="branch-highlight-icon" aria-hidden="true">📍</span>
          <p>{t("branchHighlight", lang)}</p>
        </div>
      )}

      <div className="incident-field">
        <label>{t("titleField", lang)} <span aria-hidden="true">*</span></label>
        <input
          name="title"
          value={title}
          onChange={(e) => { setTitle(e.currentTarget.value); clearFieldError("title"); setMessage(""); }}
          placeholder={t("titlePlaceholder", lang)}
          maxLength={120}
          required
        />
        {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
      </div>

      <div className="incident-field">
        <label>{t("description", lang)} <span aria-hidden="true">*</span></label>
        <textarea
          name="description"
          value={description}
          onChange={(e) => { setDescription(e.currentTarget.value); clearFieldError("description"); setMessage(""); }}
          rows={4}
          placeholder={t("descriptionPlaceholder", lang)}
          maxLength={5000}
          required
        />
        {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}
      </div>

      <div className="incident-field-row">
        <div className="incident-field">
          <label>{t("category", lang)} <span aria-hidden="true">*</span></label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.currentTarget.value as IncidentCategory | ""); clearFieldError("category"); setMessage(""); }}
            required
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{label(CATEGORY_LABELS, c, lang)}</option>
            ))}
          </select>
          {fieldErrors.category && <p className="field-error">{fieldErrors.category}</p>}
        </div>

        <div className="incident-field">
          <label>{t("originField", lang)} <span aria-hidden="true">*</span></label>
          <select
            value={origin}
            onChange={(e) => { setOrigin(e.currentTarget.value as IncidentOrigin | ""); clearFieldError("origin"); setMessage(""); }}
            required
          >
            <option value="">—</option>
            {ORIGINS.map((o) => (
              <option key={o} value={o}>{label(ORIGIN_LABELS, o, lang)}</option>
            ))}
          </select>
          {fieldErrors.origin && <p className="field-error">{fieldErrors.origin}</p>}
        </div>

        <div className="incident-field">
          <label>{t("branchField", lang)} <span aria-hidden="true">*</span></label>
          <select
            value={branch}
            onChange={(e) => { setBranch(e.currentTarget.value as IncidentBranch | ""); clearFieldError("branch"); setMessage(""); }}
            required
            className={isBranchOrigin ? "field-highlight" : ""}
          >
            <option value="">—</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>{label(BRANCH_LABELS, b, lang)}</option>
            ))}
          </select>
          {fieldErrors.branch && <p className="field-error">{fieldErrors.branch}</p>}
        </div>
      </div>

      <div className="incident-form-actions">
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? t("sending", lang) : t("submit", lang)}
        </button>
      </div>

      {message && (
        <p className={`incident-message${isError ? " error" : ""}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}

/* ───── Lista de incidencias ───── */

function IncidentTable({ incidents, lang, token, onUpdated, onSelectIncident }: {
  incidents: TrackFlowIncident[];
  lang: Lang;
  token: string;
  onUpdated: () => void;
  onSelectIncident: (inc: TrackFlowIncident) => void;
}) {
  if (!incidents.length) {
      return null;
  }
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  return (
    <div className="incident-table-wrap">
      <table className="incident-table">
        <thead>
          <tr>
            <th>{t("tableTitle", lang)}</th>
            <th>{t("tableCategory", lang)}</th>
            <th>{t("tableOrigin", lang)}</th>
            <th>{t("tableBranch", lang)}</th>
            <th>{t("tableStatus", lang)}</th>
            <th>{t("tableAction", lang)}</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => {
            const transitions = VALID_TRANSITIONS[inc.status as IncidentStatus] ?? [];
            return (
              <tr key={inc.id}>
                <td className="incident-title-cell" onClick={() => onSelectIncident(inc)} style={{ cursor: "pointer" }}>
                  <strong>{translateTitle(inc.title, lang)}</strong>
                  <span className="incident-date">{inc.created_at.slice(0, 10)}</span>
                </td>
                <td>{label(CATEGORY_LABELS, inc.category, lang)}</td>
                <td>{label(ORIGIN_LABELS, inc.origin, lang)}</td>
                <td>{label(BRANCH_LABELS, inc.branch, lang)}</td>
                <td><span className={`status-badge ${STATUS_BADGE[inc.status] ?? ""}`}>{label(STATUS_LABELS, inc.status, lang)}</span></td>
                <td>
                  {transitions.length > 0 ? (
                    <span className="status-btn-wrap">
                      <button
                        type="button"
                        className="status-btn"
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === inc.id ? null : inc.id); }}
                        onBlur={() => setTimeout(() => setOpenMenu(null), 200)}
                      >
                        {t("updateStatus", lang)} <span className="arrow">&#9660;</span>
                      </button>
                      {openMenu === inc.id && (
                        <div className="status-menu">
                          {transitions.map((s) => s ? (
                            <button
                              key={s}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                void apiRequest("/api/incidents/" + inc.id + "/status", token, {
                                  method: "PATCH",
                                  body: JSON.stringify({ status: s }),
                                }).then(() => onUpdated()).catch(() => {});
                              }}
                            >
                              {label(STATUS_LABELS, s, lang)}
                            </button>
                          ) : null)}
                        </div>
                      )}
                    </span>
                  ) : (
                    <span className="final-status">{t("final", lang)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
/* ───── Componente principal ───── */

export default function IncidentsWorkspace() {
  const { token } = useAuth();
  const { lang } = useLang();
  const [tab, setTab] = useState<"form" | "dashboard">("dashboard");
  const [summary, setSummary] = useState<IncidentManagerSummary | null>(null);
  const [incidents, setIncidents] = useState<TrackFlowIncident[]>([]);
  const [busy, setBusy] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string>("");
  const [seedError, setSeedError] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<TrackFlowIncident | null>(null);
  const [loadError, setLoadError] = useState<string>("");

  /* ── Filtros ── */
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterOrigin, setFilterOrigin] = useState<string>("");
  const [filterBranch, setFilterBranch] = useState<string>("");

  async function loadSummary() {
    if (!token) return;
    try {
      const data = await apiRequest<IncidentManagerSummary>("/api/incidents/summary", token);
      setSummary(data);
    } catch {
      /* el panel se muestra solo si hay datos */
    }
  }

  async function loadIncidents() {
    if (!token) return;
    setLoadError("");
    try {
      const params: string[] = [];
      if (filterStatus) params.push(`status=${encodeURIComponent(filterStatus)}`);
      if (filterOrigin) params.push(`origin=${encodeURIComponent(filterOrigin)}`);
      if (filterBranch) params.push(`branch=${encodeURIComponent(filterBranch)}`);
      const url = "/api/incidents" + (params.length > 0 ? "?" + params.join("&") : "");
      const data = await apiRequest<TrackFlowIncident[]>(url, token);
      setIncidents(data ?? []);
    } catch (err) {
      if (err instanceof Error) setLoadError(err.message);
    }
  }

  async function loadAll() {
    await Promise.all([loadSummary(), loadIncidents()]);
  }

  useEffect(() => {
    if (token) {
      setBusy(true);
      void loadAll().finally(() => setBusy(false));
    }
  }, [token]);

  /* Recargar incidencias al cambiar filtros */
  useEffect(() => {
    if (token && !busy) {
      void loadIncidents();
    }
  }, [filterStatus, filterOrigin, filterBranch]);

  async function seedHistory() {
    if (!token) return;
    setSeedMessage("");
    setSeedError(false);
    try {
      const result = await apiRequest<{ inserted: number; skipped: number }>(
        "/api/incidents/seed",
        token,
        { method: "POST" },
      );
      setSeedMessage(
        t("seedSuccess", lang) +
        ` — ${t("seedResult", lang)
          .replace("{inserted}", String(result.inserted))
          .replace("{skipped}", String(result.skipped))}`,
      );
      await loadAll();
    } catch (err) {
      setSeedMessage(
        t("seedError", lang) +
        (err instanceof Error ? `: ${err.message}` : ""),
      );
      setSeedError(true);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
                  TrackFlow <span aria-hidden="true">/</span> {t("operations", lang)} <span aria-hidden="true">/</span> {t("title", lang)}
        </div>
        <span className="status-pill">
                  <span aria-hidden="true" /> {t("internalTool", lang)}
        </span>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">TRACKFLOW TECH</p>
          <h1>{t("title", lang)}</h1>
          <p className="page-description">{t("subtitle", lang)}</p>
        </div>
              {tab !== "form" && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setTab("form")}
                >
                  + {t("newIncident", lang)}
                </button>
              )}
      </section>

      <div className="tab-bar" role="tablist">
        <button
          className={`tab${tab === "dashboard" ? " is-active" : ""}`}
          role="tab"
          onClick={() => setTab("dashboard")}
        >
          {t("dashboard", lang)}
        </button>
        <button
          className={`tab${tab === "form" ? " is-active" : ""}`}
          role="tab"
          onClick={() => setTab("form")}
        >
          {t("newIncident", lang)}
        </button>
        <button
          className="secondary-button seed-btn"
          type="button"
          onClick={() => void seedHistory()}
        >
          {busy ? t("seeding", lang) : t("seed", lang)}
        </button>
      </div>

      {seedMessage && (
        <div className={`incident-notice${seedError ? " error" : ""}`} role="status">
          {seedMessage}
        </div>
      )}

      {tab === "dashboard" && (
        <>
          {busy ? (
            <p className="loading-text">{t("loading", lang)}</p>
          ) : (
            <>
              {summary && <SummaryCards summary={summary} lang={lang} />}

              <section className="content-card">
                <div className="card-heading">
                  <div><h2>{t("incidentList", lang)}</h2></div>
                </div>

                {/* Filtros */}
                <div className="incident-filters">
                  <div className="incident-field">
                    <label>{t("status", lang)}</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.currentTarget.value)}>
                      <option value="">{t("all", lang)}</option>
                      <option value="open">{label(STATUS_LABELS, "open", lang)}</option>
                      <option value="in_progress">{label(STATUS_LABELS, "in_progress", lang)}</option>
                      <option value="resolved">{label(STATUS_LABELS, "resolved", lang)}</option>
                      <option value="discarded">{label(STATUS_LABELS, "discarded", lang)}</option>
                    </select>
                  </div>
                  <div className="incident-field">
                    <label>{t("origin", lang)}</label>
                    <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.currentTarget.value)}>
                      <option value="">{t("all", lang)}</option>
                      {ORIGINS.map((o) => (
                        <option key={o} value={o}>{label(ORIGIN_LABELS, o, lang)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="incident-field">
                    <label>{t("branch", lang)}</label>
                    <select value={filterBranch} onChange={(e) => setFilterBranch(e.currentTarget.value)}>
                      <option value="">{t("all", lang)}</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{label(BRANCH_LABELS, b, lang)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadError ? (
                  <div className="incident-error-bar">
                    <p className="error-message">{loadError}</p>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void loadIncidents()}
                    >
                      {t("retry", lang)}
                    </button>
                  </div>
                ) : (
                  <IncidentTable
                    incidents={incidents}
                    lang={lang}
                    token={token}
                    onUpdated={loadAll}
                    onSelectIncident={setSelectedIncident}
                  />
                )}

                {selectedIncident && (
                  <div className="incident-modal-overlay" onClick={() => setSelectedIncident(null)}>
                    <div className="incident-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="incident-modal-header">
                        <h3>{translateTitle(selectedIncident.title, lang)}</h3>
                        <button type="button" className="incident-modal-close" onClick={() => setSelectedIncident(null)}>&times;</button>
                      </div>
                      <div className="incident-modal-body">
                        <dl>
                          <dt>ID</dt><dd><code>{selectedIncident.id}</code></dd>
                          <dt>{t("detailCategory", lang)}</dt><dd>{label(CATEGORY_LABELS, selectedIncident.category, lang)}</dd>
                          <dt>{t("detailOrigin", lang)}</dt><dd>{label(ORIGIN_LABELS, selectedIncident.origin, lang)}</dd>
                          <dt>{t("detailBranch", lang)}</dt><dd>{label(BRANCH_LABELS, selectedIncident.branch, lang)}</dd>
                          <dt>{t("detailStatus", lang)}</dt><dd><span className={`status-badge ${STATUS_BADGE[selectedIncident.status] ?? ""}`}>{label(STATUS_LABELS, selectedIncident.status, lang)}</span></dd>
                          <dt>{t("detailCreated", lang)}</dt><dd>{selectedIncident.created_at.slice(0, 10)}</dd>
                          <dt>{t("detailUpdated", lang)}</dt><dd>{selectedIncident.updated_at?.slice(0, 10) ?? "-"}</dd>
                        </dl>
                        <div className="incident-description">{selectedIncident.description}</div>
                      </div>
                    </div>
                  </div>
                )}

                                {!loadError && incidents.length === 0 && !busy && (
                  <p className="empty-state">
                    {filterStatus || filterOrigin || filterBranch
                      ? t("noResults", lang)
                      : (t("noIncidents", lang))}
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}

      {tab === "form" && (
        <section className="content-card">
          <div className="card-heading">
            <div><h2>{t("newIncident", lang)}</h2></div>
          </div>
          <IncidentForm lang={lang} token={token} onCreated={loadAll} />
        </section>
      )}
    </>
  );
}
