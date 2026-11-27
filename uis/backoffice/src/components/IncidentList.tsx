"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest, ApiError } from "@/lib/api";
import type { Incident, IncidentStatus, IncidentCategory, IncidentOrigin } from "@/lib/types";

const statusLabels: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En curso",
  resolved: "Resuelta",
  discarded: "Descartada",
};

const categoryLabels: Record<string, string> = {
  lost_parcel: "Paquete perdido",
  delivery_failure: "Fallo de entrega",
  inventory_discrepancy: "Discrepancia inventario",
  carrier_issue: "Problema transportista",
  returns_issue: "Devolución",
  warehouse_incident: "Incidente almacén",
  system_failure: "Fallo del sistema",
  client_complaint: "Reclamación cliente",
  other: "Otro",
};

const branchLabels: Record<string, string> = {
  central: "Central",
  la_warehouse: "LA — Almacén",
  la_office: "LA — Oficina",
  zaragoza_warehouse: "Zaragoza — Almacén",
  zaragoza_office: "Zaragoza — Oficina",
};

const originLabels: Record<string, string> = {
  customer: "Cliente",
  branch: "Sucursal",
  internal: "Interno",
};

const statusColors: Record<IncidentStatus, string> = {
  open: "#e67e22",
  in_progress: "#3498db",
  resolved: "#27ae60",
  discarded: "#95a5a6",
};

const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

interface Props {
  onSelect?: (incident: Incident) => void;
  refreshKey?: number;
}

export default function IncidentList({ onSelect, refreshKey }: Props) {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "">("");
  const [countryFilter, setCountryFilter] = useState<"US" | "ES" | "">("");
  const [branchFilter, setBranchFilter] = useState("");
  const [originFilter, setOriginFilter] = useState<IncidentOrigin | "">("");
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (countryFilter) params.set("country", countryFilter);
      if (branchFilter) params.set("branch", branchFilter);
      if (originFilter) params.set("origin", originFilter);
      const qs = params.toString();
      const data = await apiRequest<Incident[]>(`/api/incidents${qs ? `?${qs}` : ""}`, token);
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las incidencias.");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, categoryFilter, countryFilter, branchFilter, originFilter]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  async function handleStatusUpdate(incident: Incident, newStatus: IncidentStatus) {
    if (!token) return;
    const prevStatus = incident.status;
    // Optimistic update
    setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, status: newStatus } : i)));
    setStatusUpdating((prev) => ({ ...prev, [incident.id]: true }));

    try {
      await apiRequest<Incident>(`/api/incidents/${incident.id}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Rollback on failure
      setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, status: prevStatus } : i)));
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [incident.id]: false }));
    }
  }

  function nextStatuses(current: IncidentStatus): IncidentStatus[] {
    return allowedTransitions[current] || [];
  }

  return (
    <section className="content-card" aria-labelledby="list-title">
      <div className="card-heading">
        <div>
          <h2 id="list-title">Incidencias</h2>
          <p>{loading ? "Cargando…" : `${incidents.length} registro(s)`}</p>
        </div>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "")} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as IncidentCategory | "")} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value as "US" | "ES" | "")} aria-label="Filtrar por país">
          <option value="">Todos los países</option>
          <option value="US">EE. UU.</option>
          <option value="ES">España</option>
        </select>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} aria-label="Filtrar por sucursal">
          <option value="">Todas las sucursales</option>
          {Object.entries(branchLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value as IncidentOrigin | "")} aria-label="Filtrar por origen">
          <option value="">Todos los orígenes</option>
          {Object.entries(originLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "…" : "Filtrar"}
        </button>
      </div>

      {error && (
        <div className="analysis-message error" role="alert">
          <span>{error}</span>
          <button className="secondary-button" type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && incidents.length === 0 && (
        <p className="empty-state">No hay incidencias que coincidan con los filtros.</p>
      )}

      {incidents.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Categoría</th>
                <th>Sucursal</th>
                <th>Origen</th>
                <th>País</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="clickable-row" onClick={() => onSelect?.(inc)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(inc); }}>
                  <td className="cell-mono">{inc.id.slice(0, 8)}</td>
                  <td className="cell-title">{inc.title}</td>
                  <td>
                    <span className="status-badge" style={{ background: statusColors[inc.status], color: "#fff" }}>
                      {statusLabels[inc.status]}
                    </span>
                    {nextStatuses(inc.status).length > 0 && (
                      <div className="inline-status-actions">
                        {nextStatuses(inc.status).map((ns) => (
                          <button
                            key={ns}
                            className="status-link"
                            type="button"
                            disabled={statusUpdating[inc.id]}
                            onClick={(e) => { e.stopPropagation(); void handleStatusUpdate(inc, ns); }}
                          >
                            {statusUpdating[inc.id] ? "…" : `→ ${statusLabels[ns]}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{categoryLabels[inc.category] || inc.category}</td>
                  <td>{branchLabels[inc.branch] || inc.branch}</td>
                  <td>{originLabels[inc.origin] || inc.origin || "—"}</td>
                  <td>{inc.country || "—"}</td>
                  <td className="cell-mono">{new Date(inc.updated_at).toLocaleDateString("es")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}