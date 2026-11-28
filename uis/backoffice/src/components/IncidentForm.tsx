"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Incident, IncidentCreate, IncidentCategory, IncidentBranch, IncidentOrigin } from "@/lib/types";

const categories: { value: IncidentCategory; label: string }[] = [
  { value: "lost_parcel", label: "Paquete perdido" },
  { value: "delivery_failure", label: "Fallo de entrega" },
  { value: "inventory_discrepancy", label: "Discrepancia de inventario" },
  { value: "carrier_issue", label: "Problema con transportista" },
  { value: "returns_issue", label: "Devolución" },
  { value: "warehouse_incident", label: "Incidente en almacén" },
  { value: "system_failure", label: "Fallo del sistema" },
  { value: "client_complaint", label: "Reclamación de cliente" },
  { value: "other", label: "Otro" },
];

const branches: { value: IncidentBranch; label: string }[] = [
  { value: "central", label: "Central" },
  { value: "la_warehouse", label: "Los Ángeles — Almacén" },
  { value: "la_office", label: "Los Ángeles — Oficina" },
  { value: "zaragoza_warehouse", label: "Zaragoza — Almacén" },
  { value: "zaragoza_office", label: "Zaragoza — Oficina" },
];

const origins: { value: IncidentOrigin; label: string }[] = [
  { value: "customer", label: "Cliente" },
  { value: "branch", label: "Sucursal" },
  { value: "internal", label: "Interno" },
];

const categoryMap = Object.fromEntries(categories.map((c) => [c.value, c.label]));
const branchMap = Object.fromEntries(branches.map((b) => [b.value, b.label]));

interface Props {
  onCreated?: (incident: Incident) => void;
}

export default function IncidentForm({ onCreated }: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("other");
  const [origin, setOrigin] = useState<IncidentOrigin>("customer");
  const [branch, setBranch] = useState<IncidentBranch>("central");
  const [country, setCountry] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("other");
    setOrigin("customer");
    setBranch("central");
    setCountry("");
    setCustomerType("");
    setTrackingNumber("");
    setCarrier("");
    setCustomerEmail("");
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setMessage("Inicia sesión para crear incidencias.");
      setError(true);
      return;
    }
    const payload: IncidentCreate = {
      title,
      description: description || undefined,
      category,
      origin,
      branch,
      country: country || undefined,
      customer_type: customerType || undefined,
      tracking_number: trackingNumber || undefined,
      carrier: carrier || undefined,
      customer_email: customerEmail || undefined,
    };
    setSubmitting(true);
    setMessage("");
    setError(false);
    setFieldErrors({});
    try {
      const created = await apiRequest<Incident>("/api/incidents", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Incidencia creada: ${created.id.slice(0, 8)}…`);
      reset();
      onCreated?.(created);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        setMessage("Revisa los campos señalados.");
      } else {
        setMessage(err instanceof Error ? err.message : "No se pudo crear la incidencia.");
      }
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function fieldClass(field: string): string {
    return `field-group${fieldErrors[field] ? " field-error" : ""}`;
  }

  return (
    <section className="content-card" aria-labelledby="form-title">
      <div className="card-heading">
        <div>
          <h2 id="form-title">Registrar incidencia</h2>
          <p>Rellena los campos obligatorios para crear un nuevo caso</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="supplier-form" noValidate>
        <div className={fieldClass("title")}>
          <label htmlFor="inc-title">Título *</label>
          <input
            id="inc-title" type="text" required maxLength={120}
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Resumen breve del incidente"
          />
          {fieldErrors.title && <span className="field-error-text">{fieldErrors.title}</span>}
        </div>
        <div className={fieldClass("description")}>
          <label htmlFor="inc-description">Descripción</label>
          <textarea
            id="inc-description" rows={3} maxLength={2000}
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles del incidente (opcional)"
          />
          {fieldErrors.description && <span className="field-error-text">{fieldErrors.description}</span>}
        </div>
        <div className="field-row">
          <div className={fieldClass("category")}>
            <label htmlFor="inc-category">Categoría *</label>
            <select id="inc-category" value={category} onChange={(e) => setCategory(e.target.value as IncidentCategory)}>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {fieldErrors.category && <span className="field-error-text">{fieldErrors.category}</span>}
          </div>
          <div className={fieldClass("origin")}>
            <label htmlFor="inc-origin">Origen *</label>
            <select id="inc-origin" value={origin} onChange={(e) => setOrigin(e.target.value as IncidentOrigin)}>
              {origins.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {fieldErrors.origin && <span className="field-error-text">{fieldErrors.origin}</span>}
          </div>
        </div>
        <div className="field-row">
          <div className={`${fieldClass("branch")}${origin === "branch" ? " field-highlight" : ""}`}>
            <label htmlFor="inc-branch">Sucursal *</label>
            <select id="inc-branch" value={branch} onChange={(e) => setBranch(e.target.value as IncidentBranch)}>
              {branches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {fieldErrors.branch && <span className="field-error-text">{fieldErrors.branch}</span>}
            {origin === "branch" && <small className="field-hint">Origen «Sucursal» — la sucursal es el centro del incidente</small>}
          </div>
          <div className={fieldClass("country")}>
            <label htmlFor="inc-country">País</label>
            <select id="inc-country" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">—</option>
              <option value="US">EE. UU.</option>
              <option value="ES">España</option>
            </select>
            {fieldErrors.country && <span className="field-error-text">{fieldErrors.country}</span>}
          </div>
        </div>
        <div className="field-row">
          <div className={fieldClass("customer_type")}>
            <label htmlFor="inc-customer-type">Tipo de cliente</label>
            <select id="inc-customer-type" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
              <option value="">—</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
            {fieldErrors.customer_type && <span className="field-error-text">{fieldErrors.customer_type}</span>}
          </div>
          <div className={fieldClass("tracking_number")}>
            <label htmlFor="inc-tracking">N.º de seguimiento</label>
            <input id="inc-tracking" type="text" maxLength={50} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            {fieldErrors.tracking_number && <span className="field-error-text">{fieldErrors.tracking_number}</span>}
          </div>
        </div>
        <div className="field-row">
          <div className={fieldClass("carrier")}>
            <label htmlFor="inc-carrier">Transportista</label>
            <input id="inc-carrier" type="text" maxLength={50} value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            {fieldErrors.carrier && <span className="field-error-text">{fieldErrors.carrier}</span>}
          </div>
          <div className={fieldClass("customer_email")}>
            <label htmlFor="inc-email">Correo del cliente</label>
            <input id="inc-email" type="email" maxLength={200} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            {fieldErrors.customer_email && <span className="field-error-text">{fieldErrors.customer_email}</span>}
          </div>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={submitting || !title.trim()}>
            {submitting ? "Creando…" : "Crear incidencia"}
          </button>
        </div>
        {message && <div className={`analysis-message${error ? " error" : ""}`} role={error ? "alert" : "status"}>{message}</div>}
      </form>
    </section>
  );
}