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

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
  const [historyLoading, setHistoryLoading] = useState<Record<number, boolean>>({});

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


  async function updateRate(event: FormEvent<HTMLFormElement>, supplier: Supplier) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rate = Number(formData.get("rate"));
    if (!Number.isFinite(rate) || rate <= 0) {
      setListMessage("La tarifa debe ser un nÃºmero mayor que cero.");
      return;
    }
    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplier.id}/rate`, token, {
        method: "PATCH",
        body: JSON.stringify({ rate_per_shipment: rate }),
      });
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setListMessage(`Tarifa actualizada para ${supplier.name}.`);
    } catch (error) {
      setListMessage(errorText(error, "No se pudo actualizar la tarifa."));
    }
  }

  async function updateStatus(supplier: Supplier) {
    const nextStatus: SupplierStatus = supplier.status === "active" ? "suspended" : "active";
    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplier.id}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setListMessage(`${supplier.name}: ${nextStatus === "active" ? "activo" : "suspendido"}.`);
    } catch (error) {
      setListMessage(errorText(error, "No se pudo actualizar el estado."));
    }
  }

  async function loadHistory(supplierId: number) {
    if (history[supplierId] || historyLoading[supplierId]) return;
    setHistoryLoading((current) => ({ ...current, [supplierId]: true }));
    try {
      const data = await apiRequest<SupplierStatusHistoryEntry[]>(`/suppliers/${supplierId}/status-history`, token);
      setHistory((current) => ({ ...current, [supplierId]: data }));
    } catch (error) {
      setHistory((current) => ({ ...current, [supplierId]: [] }));
      setListMessage(errorText(error, "No se pudo cargar el historial."));
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
      setFormMessage(errorText(error, "No se pudo registrar el proveedor."));
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
          {listMessage && <p className="analysis-message" role="status" aria-live="polite">{listMessage}</p>}
          <div className="table-wrap"><table className="supplier-table"><thead><tr><th scope="col">PROVEEDOR</th><th scope="col">PAÃS</th><th scope="col">CATEGORÃAS</th><th scope="col">TARIFA / UNIDAD</th><th scope="col">ESTADO</th><th scope="col">ACTUALIZACIÃ“N DE TARIFA</th><th scope="col">ACCIONES</th></tr></thead>
            <tbody>{loading && suppliers.length === 0 ? <tr><td colSpan={7}>Cargando proveedoresâ€¦</td></tr> : filteredSuppliers.length === 0 ? <tr><td colSpan={7}>No hay proveedores que coincidan con los filtros.</td></tr> : filteredSuppliers.map((supplier) => <SupplierRows key={supplier.id} supplier={supplier} history={history[supplier.id]} historyLoading={Boolean(historyLoading[supplier.id])} onRateUpdate={updateRate} onStatusUpdate={updateStatus} onHistoryToggle={handleHistoryToggle} />)}</tbody>
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
            <div className="supplier-form-actions"><button className="primary-button" type="submit" disabled={formBusy}>{formBusy ? "Guardandoâ€¦" : "Guardar proveedor"}</button><p className="analysis-message" role="status" aria-live="polite">{formMessage}</p></div>
          </form>
        </section>
      </div>
    </>
  );
}

function SupplierRows({
  supplier,
  history,
  historyLoading,
  onRateUpdate,
  onStatusUpdate,
  onHistoryToggle,
}: {
  supplier: Supplier;
  history: SupplierStatusHistoryEntry[] | undefined;
  historyLoading: boolean;
  onRateUpdate: (event: FormEvent<HTMLFormElement>, supplier: Supplier) => void;
  onStatusUpdate: (supplier: Supplier) => void;
  onHistoryToggle: (event: SyntheticEvent<HTMLDetailsElement>, supplierId: number) => void;
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
          <form className="inline-rate-form" onSubmit={(event) => void onRateUpdate(event, supplier)}>
            <label className="visually-hidden" htmlFor={`rate-${supplier.id}`}>Nueva tarifa de {supplier.name} en {supplier.currency}</label>
            <input id={`rate-${supplier.id}`} name="rate" type="number" min="0.0001" step="any" defaultValue={supplier.rate_per_shipment} required />
            <button className="secondary-button" type="submit">Cambiar tarifa</button>
          </form>
          <button className="secondary-button" type="button" onClick={() => void onStatusUpdate(supplier)} aria-label={`${supplier.status === "active" ? "Suspender" : "Reactivar"} ${supplier.name}`}>{supplier.status === "active" ? "Suspender" : "Reactivar"}</button>
        </div></td>
      </tr>
      <tr className="supplier-history-row"><td colSpan={7}>
        <details onToggle={(event) => onHistoryToggle(event, supplier.id)}>
          <summary>Historial de suspensiones y reactivaciones</summary>
          {historyLoading ? <p>Cargando historialâ€¦</p> : history ? history.length ? <ul className="supplier-status-history">{history.map((item, index) => <li key={`${item.changed_at}-${index}`}>{item.previous_status === "active" ? "Activo" : "Suspendido"} â†’ {item.status === "active" ? "Activo" : "Suspendido"} Â· {dateFormatter.format(new Date(item.changed_at))}</li>)}</ul> : <p>Sin cambios de estado registrados.</p> : <p>Abre para consultar el historial.</p>}
        </details>
      </td></tr>
    </>
  );
}
