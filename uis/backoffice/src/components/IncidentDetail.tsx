"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import type { Incident, IncidentStatus, IncidentUpdate } from "@/lib/types";

const statusLabels: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En curso",
  resolved: "Resuelta",
  discarded: "Descartada",
};

const statusOptions: { value: IncidentStatus; label: string }[] = [
  { value: "in_progress", label: "Marcar en curso" },
  { value: "resolved", label: "Resolver" },
  { value: "discarded", label: "Descartar" },
];

const categoryLabels: Record<string, string> = {
  lost_parcel: "Paquete perdido",
  delivery_failure: "Fallo de entrega",
  inventory_discrepancy: "Discrepancia de inventario",
  carrier_issue: "Problema con transportista",
  returns_issue: "Devolución",
  warehouse_incident: "Incidente en almacén",
  system_failure: "Fallo del sistema",
  client_complaint: "Reclamación de cliente",
  other: "Otro",
};

const branchLabels: Record<string, string> = {
  central: "Central",
  la_warehouse: "Los Ángeles — Almacén",
  la_office: "Los Ángeles — Oficina",
  zaragoza_warehouse: "Zaragoza — Almacén",
  zaragoza_office: "Zaragoza — Oficina",
};

interface Props {
  incident: Incident;
  onUpdated?: (incident: Incident) => void;
  onDeleted?: (id: string) => void;
  onBack?: () => void;
}

export default function IncidentDetail({ incident, onUpdated, onDeleted, onBack }: Props) {
  const { token } = useAuth();
  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const [description, setDescription] = useState(incident.description || "");
  const [trackingNumber, setTrackingNumber] = useState(incident.tracking_number || "");
  const [carrier, setCarrier] = useState(incident.carrier || "");
  const [score, setScore] = useState<number | null>(incident.satisfaction_score);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setStatus(incident.status);
    setDescription(incident.description || "");
    setTrackingNumber(incident.tracking_number || "");
    setCarrier(incident.carrier || "");
    setScore(incident.satisfaction_score);
  }, [incident]);

  const handleUpdate = useCallback(async () => {
    if (!token) return;
    setSubmitting(true);
    setMessage("");
    setError(false);
    try {
      const payload: IncidentUpdate = {};
      if (status !== incident.status) payload.status = status;
      if (description !== (incident.description || "")) payload.description = description || undefined;
      if (trackingNumber !== (incident.tracking_number || "")) payload.tracking_number = trackingNumber || undefined;
      if (carrier !== (incident.carrier || "")) payload.carrier = carrier || undefined;
      if (score !== incident.satisfaction_score) payload.satisfaction_score = score ?? undefined;
      if (Object.keys(payload).length === 0) {
        setMessage("No hay cambios que guardar.");
        return;
      }
      const updated = await apiRequest<Incident>(
        `/api/incidents/${incident.id}`,
        token,
        { method: "PATCH", body: JSON.stringify(payload) },
      );
      setMessage("Incidencia actualizada.");
      onUpdated?.(updated);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo actualizar.");
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }, [token, incident, status, description, trackingNumber, carrier, score, onUpdated]);

  const handleDelete = useCallback(async () => {
    if (!token) return;
    if (!window.confirm("¿Eliminar esta incidencia? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    setMessage("");
    setError(false);
    try {
      await apiRequest(`/api/incidents/${incident.id}`, token, { method: "DELETE" });
      onDeleted?.(incident.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo eliminar.");
      setError(true);
      setDeleting(false);
    }
  }, [token, incident.id, onDeleted]);

  const canChooseStatus = (target: IncidentStatus): boolean => {
    if (incident.status === "open") return target === "in_progress" || target === "discarded";
    if (incident.status === "in_progress") return target === "resolved" || target === "discarded";
    return false;
  };

  return (
    <section className="content-card" aria-labelledby="detail-title">
      <div className="card-heading">
        <div>
          <h2 id="detail-title">
            {incident.id.slice(0, 8)} — {incident.title}
          </h2>
          <p>Creado {new Date(incident.created_at).toLocaleString("es")}</p>
        </div>
        {onBack && (
          <button className="secondary-button" type="button" onClick={onBack}>
            ← Volver
          </button>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <strong>Estado</strong>
          <span className={`status-badge`} style={{
            background: status === "open" ? "#e67e22" : status === "in_progress" ? "#3498db" : status === "resolved" ? "#27ae60" : "#95a5a6",
            color: "#fff",
          }}>{statusLabels[status]}</span>
        </div>
        <div className="detail-field"><strong>Categoría</strong><span>{categoryLabels[incident.category] || incident.category}</span></div>
        <div className="detail-field"><strong>Sucursal</strong><span>{branchLabels[incident.branch] || incident.branch}</span></div>
        <div className="detail-field"><strong>País</strong><span>{incident.country || "—"}</span></div>
        <div className="detail-field"><strong>Tipo cliente</strong><span>{incident.customer_type || "—"}</span></div>
        <div className="detail-field"><strong>Origen</strong><span>{incident.origin || "—"}</span></div>
        <div className="detail-field"><strong>N.º seguimiento</strong><span>{incident.tracking_number || "—"}</span></div>
        <div className="detail-field"><strong>Transportista</strong><span>{incident.carrier || "—"}</span></div>
        <div className="detail-field"><strong>Reportado por</strong><span>{incident.reported_by || "—"}</span></div>
        <div className="detail-field"><strong>Correo cliente</strong><span>{incident.customer_email || "—"}</span></div>
      </div>

      <div className="detail-section">
        <h3>Descripción</h3>
        <p>{incident.description || "Sin descripción."}</p>
      </div>

      <hr className="divider" />

      <h3>Actualizar incidencia</h3>
      <div className="update-form">
        {status !== "resolved" && status !== "discarded" && (
          <div className="field-group">
            <label htmlFor="det-status">Cambiar estado</label>
            <select id="det-status" value={status} onChange={(e) => setStatus(e.target.value as IncidentStatus)}>
              <option value={incident.status}>{statusLabels[incident.status]} (actual)</option>
              {statusOptions.filter((o) => canChooseStatus(o.value)).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field-group">
          <label htmlFor="det-description">Descripción</label>
          <textarea id="det-description" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label htmlFor="det-tracking">N.º de seguimiento</label>
            <input id="det-tracking" type="text" maxLength={50} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="det-carrier">Transportista</label>
            <input id="det-carrier" type="text" maxLength={50} value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </div>
        </div>

        {status === "resolved" && (
          <div className="field-group">
            <label htmlFor="det-score">Puntuación de satisfacción (1–5)</label>
            <input id="det-score" type="number" min={1} max={5} value={score ?? ""} onChange={(e) => setScore(e.target.value ? Number(e.target.value) : null)} />
          </div>
        )}

        <div className="form-actions">
          <button className="primary-button" type="button" onClick={() => void handleUpdate()} disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar cambios"}
          </button>
          <button className="danger-button" type="button" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar incidencia"}
          </button>
        </div>
        {message && <div className={`analysis-message${error ? " error" : ""}`} role={error ? "alert" : "status"}>{message}</div>}
      </div>
    </section>
  );
}