"use client";

import { useEffect, useState, type FormEvent, type SyntheticEvent } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang, type Lang } from "@/lib/lang";
import type { Supplier, SupplierCategory, SupplierCountry, SupplierStatus, SupplierStatusHistoryEntry } from "@/lib/types";

const CATEGORY_LOCALE: Record<string, { es: string; en: string }> = {
  carrier_last_mile:       { es: "Última milla", en: "Last mile" },
  carrier_international:   { es: "Internacional", en: "International" },
  warehouse_supplies:      { es: "Suministros de almacén", en: "Warehouse supplies" },
  packaging_materials:     { es: "Embalaje", en: "Packaging" },
  reverse_logistics:       { es: "Logística inversa", en: "Reverse logistics" },
  fleet_maintenance:       { es: "Mantenimiento de flota", en: "Fleet maintenance" },
  it_and_wms_software:     { es: "Software IT/WMS", en: "IT/WMS software" },
  cleaning_and_facilities: { es: "Limpieza e instalaciones", en: "Cleaning and facilities" },
};

const LOCALE: Record<string, { es: string; en: string }> = {
  breadcrumb:         { es: "TrackFlow / Operaciones / Proveedores", en: "TrackFlow / Operations / Suppliers" },
  internalDir:        { es: "Directorio interno", en: "Internal directory" },
  pageEyebrow:        { es: "COMPRAS Y OPERACIONES", en: "PURCHASING & OPERATIONS" },
  pageTitle:          { es: "Directorio de proveedores", en: "Supplier directory" },
  pageDesc:           { es: "Proveedores de carriers, almacén y servicios para USA y España.", en: "Carrier, warehouse and service suppliers for USA and Spain." },
  demoNotice:         { es: "Aviso sobre los datos", en: "Data notice" },
  demoNoticeText:     { es: "Datos del briefing para demostración. El directorio persiste en TinyDB local y no representa una integración con sistemas de compras.", en: "Briefing data for demo. The directory persists in local TinyDB and does not represent an integration with procurement systems." },
  filterTitle:        { es: "Filtrar proveedores", en: "Filter suppliers" },
  filterDesc:         { es: "Los filtros actualizan el listado al instante, sin recargar ni consultar de nuevo la API.", en: "Filters update the list instantly, without reloading or re-querying the API." },
  country:            { es: "País", en: "Country" },
  all:                { es: "Todos", en: "All" },
  allFem:             { es: "Todas", en: "All" },
  category:           { es: "Categoría", en: "Category" },
  clearFilters:       { es: "Limpiar filtros", en: "Clear filters" },
  supplierListTitle:  { es: "Proveedores", en: "Suppliers" },
  loadingDir:         { es: "Cargando directorio…", en: "Loading directory…" },
  updating:           { es: "Actualizando…", en: "Updating…" },
  updateList:         { es: "Actualizar lista", en: "Update list" },
  of:                 { es: "de", en: "of" },
  supplier:           { es: "PROVEEDOR", en: "SUPPLIER" },
  countryCol:         { es: "PAÍS", en: "COUNTRY" },
  categoriesCol:      { es: "CATEGORÍAS", en: "CATEGORIES" },
  rateCol:            { es: "TARIFA / UNIDAD", en: "RATE / UNIT" },
  statusCol:          { es: "ESTADO", en: "STATUS" },
  rateUpdateCol:      { es: "ACTUALIZACIÓN DE TARIFA", en: "RATE UPDATE" },
  actionsCol:         { es: "ACCIONES", en: "ACTIONS" },
  loadingSuppliers:   { es: "Cargando proveedores…", en: "Loading suppliers…" },
  noFilterMatch:      { es: "No hay proveedores que coincidan con los filtros.", en: "No suppliers match the applied filters." },
  createTitle:        { es: "Registrar proveedor", en: "Register supplier" },
  createDesc:         { es: "Los campos obligatorios coinciden con las reglas de validación de la API.", en: "Required fields match the API validation rules." },
  businessName:       { es: "Nombre comercial", en: "Business name" },
  countryForm:        { es: "País", en: "Country" },
  currency:           { es: "Moneda", en: "Currency" },
  currencyHelp:       { es: "USD para USA; EUR para España.", en: "USD for USA; EUR for Spain." },
  ratePerUnit:        { es: "Tarifa por envío/unidad", en: "Rate per shipment/unit" },
  statusForm:         { es: "Estado", en: "Status" },
  active:             { es: "Activo", en: "Active" },
  suspended:          { es: "Suspendido", en: "Suspended" },
  categoriesForm:     { es: "Categorías", en: "Categories" },
  multiHelp:          { es: "Puedes seleccionar varias.", en: "You can select multiple." },
  serviceZone:        { es: "Zona de servicio (opcional)", en: "Service zone (optional)" },
  contactEmail:       { es: "Email de contacto (opcional)", en: "Contact email (optional)" },
  notes:              { es: "Notas (opcional)", en: "Notes (optional)" },
  saving:             { es: "Guardando…", en: "Saving…" },
  saveSupplier:       { es: "Guardar proveedor", en: "Save supplier" },
  directoryUpdated:   { es: "Directorio actualizado.", en: "Directory updated." },
  loadError:          { es: "No se pudo cargar el directorio.", en: "Could not load the directory." },
  rateError:          { es: "La tarifa debe ser un número mayor que cero.", en: "The rate must be a number greater than zero." },
  rateUpdated:        { es: "Tarifa actualizada para", en: "Rate updated for" },
  rateUpdateError:    { es: "No se pudo actualizar la tarifa.", en: "Could not update the rate." },
  statusToggleActive: { es: "activo", en: "active" },
  statusToggleSuspended: { es: "suspendido", en: "suspended" },
  statusUpdateError:  { es: "No se pudo actualizar el estado.", en: "Could not update the status." },
  historyLoadError:   { es: "No se pudo cargar el historial.", en: "Could not load the history." },
  supplierRegistered: { es: "Proveedor registrado correctamente.", en: "Supplier registered successfully." },
  supplierCreateError:{ es: "No se pudo registrar el proveedor.", en: "Could not register the supplier." },
  changeRate:         { es: "Cambiar tarifa", en: "Change rate" },
  suspend:            { es: "Suspender", en: "Suspend" },
  reactivate:         { es: "Reactivar", en: "Reactivate" },
  statusHistory:      { es: "Historial de suspensiones y reactivaciones", en: "Suspension and reactivation history" },
  loadingHistory:     { es: "Cargando historial…", en: "Loading history…" },
  noHistory:          { es: "Sin cambios de estado registrados.", en: "No status changes recorded." },
  openForHistory:     { es: "Abre para consultar el historial.", en: "Open to view history." },
  spain:              { es: "España", en: "Spain" },
  newRateLabel:       { es: "Nueva tarifa de", en: "New rate for" },
  actionsAria:        { es: "Acciones de", en: "Actions for" },
};

const categories: { value: SupplierCategory; label: string }[] = [
  { value: "carrier_last_mile",           label: "Última milla" },
  { value: "carrier_international",       label: "Internacional" },
  { value: "warehouse_supplies",          label: "Suministros de almacén" },
  { value: "packaging_materials",         label: "Embalaje" },
  { value: "reverse_logistics",           label: "Logística inversa" },
  { value: "fleet_maintenance",           label: "Mantenimiento de flota" },
  { value: "it_and_wms_software",         label: "Software IT/WMS" },
  { value: "cleaning_and_facilities",     label: "Limpieza e instalaciones" },
];

function catLabel(value: string, lang: Lang): string {
  return CATEGORY_LOCALE[value]?.[lang] ?? value;
}

const currencyFor = (country: SupplierCountry) => country === "USA" ? "USD" : "EUR";
const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });
const rateFormatter = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function SuppliersWorkspace() {
  const { token } = useAuth();
  const { lang } = useLang();
  const t = (key: string): string => LOCALE[key]?.[lang] ?? key;
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
        setListMessage(t("directoryUpdated"));
    } catch (error) {
        setListMessage(errorText(error, t("loadError")));
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
        setListMessage(t("rateError"));
      return;
    }
    try {
      const updated = await apiRequest<Supplier>(`/suppliers/${supplier.id}/rate`, token, {
        method: "PATCH",
        body: JSON.stringify({ rate_per_shipment: rate }),
      });
      setSuppliers((current) => current.map((item) => item.id === updated.id ? updated : item));
        setListMessage(`${t("rateUpdated")} ${supplier.name}.`);
    } catch (error) {
        setListMessage(errorText(error, t("rateUpdateError")));
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
        setListMessage(`${supplier.name}: ${nextStatus === "active" ? t("statusToggleActive") : t("statusToggleSuspended")}.`);
    } catch (error) {
        setListMessage(errorText(error, t("statusUpdateError")));
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
        setListMessage(errorText(error, t("historyLoadError")));
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
        setFormMessage(t("saving"));
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
          setFormMessage(t("supplierRegistered"));
    } catch (error) {
          setFormMessage(errorText(error, t("supplierCreateError")));
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <>
      <header className="topbar">
          <div className="breadcrumb">{t("breadcrumb")}</div>
          <span className="status-pill"><span aria-hidden="true" /> {t("internalDir")}</span>
      </header>
      <section className="page-heading">
          <div><p className="eyebrow">{t("pageEyebrow")}</p><h1>{t("pageTitle")}</h1><p className="page-description">{t("pageDesc")}</p></div>
      </section>
        <section className="demo-notice" aria-label={t("demoNotice")}><span aria-hidden="true">i</span><p><strong>{t("demoNoticeText")}</strong></p></section>

      <div className="supplier-workspace">
        <section className="content-card" aria-labelledby="filter-title">
            <div className="card-heading"><div><h2 id="filter-title">{t("filterTitle")}</h2><p>{t("filterDesc")}</p></div></div>
          <div className="supplier-filters">
              <label htmlFor="country-filter">{t("country")}<select id="country-filter" value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="">{t("all")}</option><option value="USA">USA</option><option value="Spain">{t("spain")}</option></select></label>
              <label htmlFor="category-filter">{t("category")}<select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">{t("allFem")}</option>{categories.map((category) => <option value={category.value} key={category.value}>{catLabel(category.value, lang)}</option>)}</select></label>
              <button className="secondary-button" type="button" onClick={() => { setCountryFilter(""); setCategoryFilter(""); }}>{t("clearFilters")}</button>
          </div>
        </section>

        <section className="content-card supplier-table-card" aria-labelledby="supplier-list-title">
            <div className="card-heading"><div><h2 id="supplier-list-title">{t("supplierListTitle")}</h2><p aria-live="polite">{loading ? t("loadingDir") : `${filteredSuppliers.length} ${t("of")} ${suppliers.length} ${t("supplierListTitle").toLowerCase()}`}</p></div><button className="secondary-button" type="button" onClick={() => void loadSuppliers(token)} disabled={loading}>{loading ? t("updating") : t("updateList")}</button></div>
          {listMessage && <p className="analysis-message" role="status" aria-live="polite">{listMessage}</p>}
            <div className="table-wrap"><table className="supplier-table"><thead><tr><th scope="col">{t("supplier")}</th><th scope="col">{t("countryCol")}</th><th scope="col">{t("categoriesCol")}</th><th scope="col">{t("rateCol")}</th><th scope="col">{t("statusCol")}</th><th scope="col">{t("rateUpdateCol")}</th><th scope="col">{t("actionsCol")}</th></tr></thead>
              <tbody>{loading && suppliers.length === 0 ? <tr><td colSpan={7}>{t("loadingSuppliers")}</td></tr> : filteredSuppliers.length === 0 ? <tr><td colSpan={7}>{t("noFilterMatch")}</td></tr> : filteredSuppliers.map((supplier) => <SupplierRows key={supplier.id} lang={lang} supplier={supplier} history={history[supplier.id]} historyLoading={Boolean(historyLoading[supplier.id])} onRateUpdate={updateRate} onStatusUpdate={updateStatus} onHistoryToggle={handleHistoryToggle} />)}</tbody>
          </table></div>
        </section>

        <section className="content-card supplier-form-card" aria-labelledby="create-title">
            <div className="card-heading"><div><h2 id="create-title">{t("createTitle")}</h2><p>{t("createDesc")}</p></div></div>
          <form className="supplier-form" onSubmit={createSupplier}>
              <label htmlFor="supplier-name">{t("businessName")}<input id="supplier-name" name="name" maxLength={160} required /></label>
              <label htmlFor="supplier-country">{t("countryForm")}<select id="supplier-country" name="country" value={formCountry} onChange={(event) => setFormCountry(event.target.value as SupplierCountry)}><option value="USA">USA</option><option value="Spain">{t("spain")}</option></select></label>
              <label htmlFor="supplier-currency">{t("currency")}<input id="supplier-currency" value={currencyFor(formCountry)} readOnly aria-describedby="currency-help" /><span id="currency-help" className="field-help">{t("currencyHelp")}</span></label>
              <label htmlFor="supplier-rate">{t("ratePerUnit")}<input id="supplier-rate" name="rate_per_shipment" type="number" min="0.0001" step="any" required /></label>
              <label htmlFor="supplier-status">{t("statusForm")}<select id="supplier-status" name="status"><option value="active">{t("active")}</option><option value="suspended">{t("suspended")}</option></select></label>
              <label htmlFor="supplier-categories">{t("categoriesForm")}<span className="field-help">{t("multiHelp")}</span><select id="supplier-categories" name="categories" multiple required size={5}>{categories.map((category) => <option value={category.value} key={category.value}>{catLabel(category.value, lang)}</option>)}</select></label>
              <label htmlFor="supplier-zone">{t("serviceZone")}<input id="supplier-zone" name="service_zone" maxLength={160} /></label>
              <label htmlFor="supplier-email">{t("contactEmail")}<input id="supplier-email" name="contact_email" type="email" /></label>
              <label className="supplier-notes" htmlFor="supplier-notes">{t("notes")}<textarea id="supplier-notes" name="notes" maxLength={1000} rows={3} /></label>
              <div className="supplier-form-actions"><button className="primary-button" type="submit" disabled={formBusy}>{formBusy ? t("saving") : t("saveSupplier")}</button><p className="analysis-message" role="status" aria-live="polite">{formMessage}</p></div>
          </form>
        </section>
      </div>
    </>
  );
}

function SupplierRows({
    lang,
  supplier,
  history,
  historyLoading,
  onRateUpdate,
  onStatusUpdate,
  onHistoryToggle,
}: {
    lang: Lang;
  supplier: Supplier;
  history: SupplierStatusHistoryEntry[] | undefined;
  historyLoading: boolean;
  onRateUpdate: (event: FormEvent<HTMLFormElement>, supplier: Supplier) => void;
  onStatusUpdate: (supplier: Supplier) => void;
  onHistoryToggle: (event: SyntheticEvent<HTMLDetailsElement>, supplierId: number) => void;
}) {
    const t = (key: string): string => LOCALE[key]?.[lang] ?? key;
  return (
    <>
      <tr>
          <td className="reference">{supplier.name}</td><td>{supplier.country === "Spain" ? t("spain") : supplier.country}</td>
          <td>{supplier.categories.map((category) => catLabel(category, lang)).join(", ")}</td>
        <td>{rateFormatter.format(supplier.rate_per_shipment)} {supplier.currency}</td>
          <td><span className={`supplier-status ${supplier.status}`}>{supplier.status === "active" ? t("active") : t("suspended")}</span></td>
        <td>{dateFormatter.format(new Date(supplier.updated_at))}</td>
          <td><div className="supplier-actions" aria-label={`${t("actionsAria")} ${supplier.name}`}>
          <form className="inline-rate-form" onSubmit={(event) => void onRateUpdate(event, supplier)}>
              <label className="visually-hidden" htmlFor={`rate-${supplier.id}`}>{t("newRateLabel")} {supplier.name} ({supplier.currency})</label>
            <input id={`rate-${supplier.id}`} name="rate" type="number" min="0.0001" step="any" defaultValue={supplier.rate_per_shipment} required />
              <button className="secondary-button" type="submit">{t("changeRate")}</button>
          </form>
            <button className="secondary-button" type="button" onClick={() => void onStatusUpdate(supplier)} aria-label={`${supplier.status === "active" ? t("suspend") : t("reactivate")} ${supplier.name}`}>{supplier.status === "active" ? t("suspend") : t("reactivate")}</button>
        </div></td>
      </tr>
      <tr className="supplier-history-row"><td colSpan={7}>
        <details onToggle={(event) => onHistoryToggle(event, supplier.id)}>
            <summary>{t("statusHistory")}</summary>
            {historyLoading ? <p>{t("loadingHistory")}</p> : history ? history.length ? <ul className="supplier-status-history">{history.map((item, index) => <li key={`${item.changed_at}-${index}`}>{item.previous_status === "active" ? t("active") : t("suspended")} → {item.status === "active" ? t("active") : t("suspended")} · {dateFormatter.format(new Date(item.changed_at))}</li>)}</ul> : <p>{t("noHistory")}</p> : <p>{t("openForHistory")}</p>}
        </details>
      </td></tr>
    </>
  );
}
