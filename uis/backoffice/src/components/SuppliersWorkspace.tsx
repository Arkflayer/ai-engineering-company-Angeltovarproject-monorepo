"use client";

import { useEffect, useState, type FormEvent, type SyntheticEvent } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Supplier, SupplierCategory, SupplierCountry, SupplierStatus, SupplierStatusHistoryEntry } from "@/lib/types";

const categories: { value: SupplierCategory; label: string }[] = [
  { value: "carrier_last_mile", label: "Ãšltima milla" },
  { value: "carrier_international", label: "Internacional" },
  { value: "warehouse_supplies", label: "Suministros de almacÃ©n" },
  { value: "packaging_materials", label: "Embalaje" },
  { value: "reverse_logistics", label: "LogÃ­stica inversa" },
  { value: "fleet_maintenance", label: "Mantenimiento de flota" },
  { value: "it_and_wms_software", label: "Software IT/WMS" },
  { value: "cleaning_and_facilities", label: "Limpieza e instalaciones" },
];

const categoryLabels = Object.fromEntries(categories.map((category) => [category.value, category.label])) as Record<SupplierCategory, string>;
const currencyFor = (country: SupplierCountry) => country === "USA" ? "USD" : "EUR";
const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });
const rateFormatter = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

function errorText(_error: unknown, fallback: string) {
  return fallback;
}

export default function SuppliersWorkspace() {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formCountry, setFormCountry] = useState<SupplierCountry>("USA");
  const [loading, setLoading] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [listMessage, setListMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [history, setHistory] = useState<Record<number, SupplierStatusHistoryEntry[]>>({});
  const [historyErrors, setHistoryErrors] = useState<Record<number, string>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<number, boolean>>({});
  const [rateErrors, setRateErrors] = useState<Record<number, string>>({});
  const [statusErrors, setStatusErrors] = useState<Record<number, string>>({});
  const [rateBusy, setRateBusy] = useState<Record<number, boolean>>({});
  const [statusBusy, setStatusBusy] = useState<Record<number, boolean>>({});
  const [rateRetry, setRateRetry] = useState<Record<number, number>>({});
  const [statusRetry, setStatusRetry] = useState<Record<number, SupplierStatus>>({});

  const filteredSuppliers = suppliers.filter((supplier) =>
    (!countryFilter || supplier.country === countryFilter)
    && (!categoryFilter || supplier.categories.includes(categoryFilter as SupplierCategory))
  );

  async function loadSuppliers(sessionToken: string) {
    setLoading(true);
    setListMessage("");
    try {
      const data = await apiRequest<Supplier[]>("/suppliers", sessionToken);
      setSuppliers(data);
      setListMessage("Directorio actualizado.");
    } catch (error) {
      setListMessage(errorText(error, "No se pudo cargar el directorio."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => { void loadSuppliers(token); }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);


  async function updateRate(supplier: Supplier, rate: number) {
    if (!Number.isFinite(rate) || rate <= 0 || rateBusy[supplier.id]) return;
    setRateBusy((current) => ({ ...current, [supplier.id]: true }));
    setRateErrors((current) => ({ ...current, [supplier.id]: "" }));
    setRateRetry((current) => ({ ...current, [supplier.id]: rate }));
    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplier.id}/rate`, token, {
        method: "PATCH",
        body: JSON.stringify({ rate_per_shipment: rate }),
      });
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setRateErrors((current) => ({ ...current, [supplier.id]: "" }));
    } catch {
      setRateErrors((current) => ({ ...current, [supplier.id]: "No se pudo actualizar la tarifa. Inténtalo de nuevo." }));
    } finally {
      setRateBusy((current) => ({ ...current, [supplier.id]: false }));
    }
  }

  async function updateStatus(supplier: Supplier, nextStatus: SupplierStatus) {
    if (statusBusy[supplier.id]) return;
    setStatusBusy((current) => ({ ...current, [supplier.id]: true }));
    setStatusErrors((current) => ({ ...current, [supplier.id]: "" }));
    setStatusRetry((current) => ({ ...current, [supplier.id]: nextStatus }));
    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplier.id}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setStatusErrors((current) => ({ ...current, [supplier.id]: "" }));
    } catch {
      setStatusErrors((current) => ({ ...current, [supplier.id]: "No se pudo actualizar el estado. Inténtalo de nuevo." }));
    } finally {
      setStatusBusy((current) => ({ ...current, [supplier.id]: false }));
    }
  }

  function handleRateSubmit(event: FormEvent<HTMLFormElement>, supplier: Supplier) {
    event.preventDefault();
    const rate = Number(new FormData(event.currentTarget).get("rate"));
    if (!Number.isFinite(rate) || rate <= 0) {
      setRateErrors((current) => ({ ...current, [supplier.id]: "La tarifa debe ser un número mayor que cero." }));
      return;
    }
    void updateRate(supplier, rate);
  }

  async function loadHistory(supplierId: number, retry = false) {
    if ((!retry && history[supplierId] !== undefined) || historyLoading[supplierId]) return;
    setHistoryLoading((current) => ({ ...current, [supplierId]: true }));
    setHistoryErrors((current) => ({ ...current, [supplierId]: "" }));
    try {
      const data = await apiRequest<SupplierStatusHistoryEntry[]>(`/suppliers/${supplierId}/status-history`, token);
      setHistory((current) => ({ ...current, [supplierId]: data }));
    } catch {
      setHistoryErrors((current) => ({ ...current, [supplierId]: "No se pudo cargar el historial. Inténtalo de nuevo." }));
    } finally {
      setHistoryLoading((current) => ({ ...current, [supplierId]: false }));
    }
  }

  function handleHistoryToggle(event: SyntheticEvent<HTMLDetailsElement>, supplierId: number) {
    if (event.currentTarget.open) void loadHistory(supplierId);
  }

  async function createSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const country = String(data.get("country")) as SupplierCountry;
    const email = String(data.get("contact_email") || "").trim();
    const payload = {
      name: String(data.get("name") || "").trim(),
      country,
      categories: data.getAll("categories").map(String) as SupplierCategory[],
      rate_per_shipment: Number(data.get("rate_per_shipment")),
      currency: currencyFor(country),
      status: String(data.get("status")),
      service_zone: String(data.get("service_zone") || "").trim() || null,
      contact_email: email || null,
      notes: String(data.get("notes") || "").trim() || null,
    };
    setFormBusy(true);
    setFormMessage("Guardando proveedorâ€¦");
    try {
      const created = await apiRequest<Supplier>("/suppliers", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuppliers((current) => [created, ...current]);
      setCountryFilter("");
      setCategoryFilter("");
      form.reset();
      setFormCountry("USA");
      setFormMessage("Proveedor registrado correctamente.");
    } catch (error) {
      setFormMessage(errorText(error, "No se pudo registrar el proveedor. Revisa los datos e inténtalo de nuevo."));
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">TrackFlow <span aria-hidden="true">/</span> Operaciones <span aria-hidden="true">/</span> Proveedores</div>
        <span className="status-pill"><span aria-hidden="true" /> Directorio interno</span>
      </header>
      <section className="page-heading">
        <div><p className="eyebrow">COMPRAS Y OPERACIONES</p><h1>Directorio de proveedores</h1><p className="page-description">Proveedores de carriers, almacÃ©n y servicios para USA y EspaÃ±a.</p></div>
      </section>
      <section className="demo-notice" aria-label="Aviso sobre los datos"><span aria-hidden="true">i</span><p><strong>Datos del briefing para demostraciÃ³n.</strong> El directorio persiste en TinyDB local y no representa una integraciÃ³n con sistemas de compras.</p></section>

      <div className="supplier-workspace">
        <section className="content-card" aria-labelledby="filter-title">
          <div className="card-heading"><div><h2 id="filter-title">Filtrar proveedores</h2><p>Los filtros actualizan el listado al instante, sin recargar ni consultar de nuevo la API.</p></div></div>
          <div className="supplier-filters">
            <label htmlFor="country-filter">PaÃ­s<select id="country-filter" value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="">Todos</option><option value="USA">USA</option><option value="Spain">EspaÃ±a</option></select></label>
            <label htmlFor="category-filter">CategorÃ­a<select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas</option>{categories.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}</select></label>
            <button className="secondary-button" type="button" onClick={() => { setCountryFilter(""); setCategoryFilter(""); }}>Limpiar filtros</button>
          </div>
        </section>

        <section className="content-card supplier-table-card" aria-labelledby="supplier-list-title">
          <div className="card-heading"><div><h2 id="supplier-list-title">Proveedores</h2><p aria-live="polite">{loading ? "Cargando directorioâ€¦" : `${filteredSuppliers.length} de ${suppliers.length} proveedores`}</p></div><button className="secondary-button" type="button" onClick={() => void loadSuppliers(token)} disabled={loading}>{loading ? "Actualizandoâ€¦" : "Actualizar lista"}</button></div>
          {listMessage && <div className={`analysis-message${listMessage.includes("No se pudo") ? " error" : ""}`} role={listMessage.includes("No se pudo") ? "alert" : "status"} aria-live="polite"><p>{listMessage}</p>{listMessage.includes("No se pudo") && <button type="button" className="secondary-button" onClick={() => void loadSuppliers(token)} disabled={loading}>Reintentar</button>}</div>}
          <div className="table-wrap"><table className="supplier-table"><thead><tr><th scope="col">PROVEEDOR</th><th scope="col">PAÃS</th><th scope="col">CATEGORÃAS</th><th scope="col">TARIFA / UNIDAD</th><th scope="col">ESTADO</th><th scope="col">ACTUALIZACIÃ“N DE TARIFA</th><th scope="col">ACCIONES</th></tr></thead>
            <tbody>{loading && suppliers.length === 0 ? <tr><td colSpan={7}>Cargando proveedoresâ€¦</td></tr> : filteredSuppliers.length === 0 ? <tr><td colSpan={7}>No hay proveedores que coincidan con los filtros.</td></tr> : filteredSuppliers.map((supplier) => <SupplierRows key={supplier.id} supplier={supplier} history={history[supplier.id]} historyError={historyErrors[supplier.id]} historyLoading={Boolean(historyLoading[supplier.id])} rateError={rateErrors[supplier.id]} statusError={statusErrors[supplier.id]} rateBusy={Boolean(rateBusy[supplier.id])} statusBusy={Boolean(statusBusy[supplier.id])} retryRate={rateRetry[supplier.id]} retryStatus={statusRetry[supplier.id]} onRateUpdate={handleRateSubmit} onRateRetry={(rate) => void updateRate(supplier, rate)} onStatusUpdate={(next) => void updateStatus(supplier, next)} onHistoryToggle={handleHistoryToggle} onHistoryRetry={(supplierId) => void loadHistory(supplierId, true)} />)}</tbody>
          </table></div>
        </section>

        <section className="content-card supplier-form-card" aria-labelledby="create-title">
          <div className="card-heading"><div><h2 id="create-title">Registrar proveedor</h2><p>Los campos obligatorios coinciden con las reglas de validaciÃ³n de la API.</p></div></div>
          <form className="supplier-form" onSubmit={createSupplier}>
            <label htmlFor="supplier-name">Nombre comercial<input id="supplier-name" name="name" maxLength={160} required /></label>
            <label htmlFor="supplier-country">PaÃ­s<select id="supplier-country" name="country" value={formCountry} onChange={(event) => setFormCountry(event.target.value as SupplierCountry)}><option value="USA">USA</option><option value="Spain">EspaÃ±a</option></select></label>
            <label htmlFor="supplier-currency">Moneda<input id="supplier-currency" value={currencyFor(formCountry)} readOnly aria-describedby="currency-help" /><span id="currency-help" className="field-help">USD para USA; EUR para EspaÃ±a.</span></label>
            <label htmlFor="supplier-rate">Tarifa por envÃ­o/unidad<input id="supplier-rate" name="rate_per_shipment" type="number" min="0.0001" step="any" required /></label>
            <label htmlFor="supplier-status">Estado<select id="supplier-status" name="status"><option value="active">Activo</option><option value="suspended">Suspendido</option></select></label>
            <label htmlFor="supplier-categories">CategorÃ­as<span className="field-help">Puedes seleccionar varias.</span><select id="supplier-categories" name="categories" multiple required size={5}>{categories.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}</select></label>
            <label htmlFor="supplier-zone">Zona de servicio (opcional)<input id="supplier-zone" name="service_zone" maxLength={160} /></label>
            <label htmlFor="supplier-email">Email de contacto (opcional)<input id="supplier-email" name="contact_email" type="email" /></label>
            <label className="supplier-notes" htmlFor="supplier-notes">Notas (opcional)<textarea id="supplier-notes" name="notes" maxLength={1000} rows={3} /></label>
            <div className="supplier-form-actions"><button className="primary-button" type="submit" disabled={formBusy}>{formBusy ? "Guardandoâ€¦" : "Guardar proveedor"}</button>{formMessage && <p className={`analysis-message${formMessage.startsWith("No se pudo") ? " error" : ""}`} role={formMessage.startsWith("No se pudo") ? "alert" : "status"} aria-live="polite">{formMessage}</p>}</div>
          </form>
        </section>
      </div>
    </>
  );
}

function SupplierRows({
  supplier,
  history,
  historyError,
  historyLoading,
  rateError,
  statusError,
  rateBusy,
  statusBusy,
  retryRate,
  retryStatus,
  onRateUpdate,
  onRateRetry,
  onStatusUpdate,
  onHistoryToggle,
  onHistoryRetry,
}: {
  supplier: Supplier;
  history: SupplierStatusHistoryEntry[] | undefined;
  historyError: string | undefined;
  historyLoading: boolean;
  rateError: string | undefined;
  statusError: string | undefined;
  rateBusy: boolean;
  statusBusy: boolean;
  retryRate: number | undefined;
  retryStatus: SupplierStatus | undefined;
  onRateUpdate: (event: FormEvent<HTMLFormElement>, supplier: Supplier) => void;
  onRateRetry: (rate: number) => void;
  onStatusUpdate: (nextStatus: SupplierStatus) => void;
  onHistoryToggle: (event: SyntheticEvent<HTMLDetailsElement>, supplierId: number) => void;
  onHistoryRetry: (supplierId: number) => void;
}) {
  return (
    <>
      <tr>
        <td className="reference">{supplier.name}</td><td>{supplier.country === "Spain" ? "EspaÃ±a" : supplier.country}</td>
        <td>{supplier.categories.map((category) => categoryLabels[category]).join(", ")}</td>
        <td>{rateFormatter.format(supplier.rate_per_shipment)} {supplier.currency}</td>
        <td><span className={`supplier-status ${supplier.status}`}>{supplier.status === "active" ? "Activo" : "Suspendido"}</span></td>
        <td>{dateFormatter.format(new Date(supplier.updated_at))}</td>
        <td><div className="supplier-actions" aria-label={`Acciones de ${supplier.name}`}>
          <form className="inline-rate-form" onSubmit={(event) => onRateUpdate(event, supplier)}>
            <label className="visually-hidden" htmlFor={`rate-${supplier.id}`}>Nueva tarifa de {supplier.name} en {supplier.currency}</label>
            <input id={`rate-${supplier.id}`} name="rate" type="number" min="0.0001" step="any" defaultValue={supplier.rate_per_shipment} required />
            <button className="secondary-button" type="submit" disabled={rateBusy}>{rateBusy ? "Actualizando…" : "Cambiar tarifa"}</button>
          </form>
          {rateError && <div role="alert"><p>{rateError}</p>{retryRate !== undefined && <button type="button" className="secondary-button" onClick={() => onRateRetry(retryRate)} disabled={rateBusy}>Reintentar tarifa</button>}</div>}
          <button className="secondary-button" type="button" onClick={() => onStatusUpdate(supplier.status === "active" ? "suspended" : "active")} disabled={statusBusy} aria-label={`${supplier.status === "active" ? "Suspender" : "Reactivar"} ${supplier.name}`}>{statusBusy ? "Actualizando…" : supplier.status === "active" ? "Suspender" : "Reactivar"}</button>
          {statusError && <div role="alert"><p>{statusError}</p>{retryStatus && <button type="button" className="secondary-button" onClick={() => onStatusUpdate(retryStatus)} disabled={statusBusy}>Reintentar estado</button>}</div>}
        </div></td>
      </tr>
      <tr className="supplier-history-row"><td colSpan={7}>
        <details onToggle={(event) => onHistoryToggle(event, supplier.id)}>
          <summary>Historial de suspensiones y reactivaciones</summary>
          {historyLoading ? <p role="status">Cargando historial…</p> : historyError ? <div><p role="alert">{historyError}</p><button type="button" className="secondary-button" onClick={() => onHistoryRetry(supplier.id)}>Reintentar</button></div> : history ? history.length ? <ul className="supplier-status-history">{history.map((item, index) => <li key={`${item.changed_at}-${index}`}>{item.previous_status === "active" ? "Activo" : "Suspendido"} â†’ {item.status === "active" ? "Activo" : "Suspendido"} Â· {dateFormatter.format(new Date(item.changed_at))}</li>)}</ul> : <p>Sin cambios de estado registrados.</p> : <p>Abre para consultar el historial.</p>}
        </details>
      </td></tr>
    </>
  );
}
