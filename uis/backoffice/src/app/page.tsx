import Link from "next/link";

const shipments = [
  ["TF-DEMO-10482", "Madrid, ES", "Zaragoza", "SEUR", "Entregado", "delivered"],
  ["TF-DEMO-10481", "Valencia, ES", "Zaragoza", "MRW", "En tránsito", "transit"],
  ["TF-DEMO-10480", "San Diego, US", "Los Ángeles", "UPS", "Incidencia", "attention"],
  ["TF-DEMO-10479", "Barcelona, ES", "Zaragoza", "DHL", "En tránsito", "transit"],
];

const metrics = [
  { label: "Envíos procesados", value: "1.284", note: "↑ 8,2% vs. periodo anterior", symbol: "↗", tone: "green" },
  { label: "Entregas a tiempo", value: "96,8%", note: "↑ 1,4% vs. periodo anterior", symbol: "✓", tone: "blue" },
  { label: "En tránsito", value: "327", note: "En todos los centros", symbol: "⇢", tone: "amber" },
  { label: "Incidencias abiertas", value: "12", note: "Requieren seguimiento", symbol: "!", tone: "rose" },
];

export default function HomePage() {
  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">TrackFlow <span aria-hidden="true">/</span> Operaciones</div>
        <span className="status-pill"><span aria-hidden="true" /> Entorno de demostración</span>
      </header>
      <section className="page-heading">
        <div>
          <p className="eyebrow">VISTA GENERAL</p>
          <h1>Buenos días, equipo</h1>
          <p className="page-description">Un vistazo a la actividad de tus operaciones.</p>
        </div>
        <span className="date-button">Últimos 7 días</span>
      </section>
      <section className="demo-notice" aria-label="Aviso sobre los datos">
        <span aria-hidden="true">i</span>
        <p><strong>Datos de muestra.</strong> Este prototipo no está conectado a inventario ni a sistemas de seguimiento en tiempo real.</p>
      </section>
      <section className="metrics-grid" aria-label="Indicadores de demostración">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-top"><span>{metric.label}</span><span className={`metric-icon ${metric.tone}`} aria-hidden="true">{metric.symbol}</span></div>
            <p className="metric-value">{metric.value}</p>
            <p className="metric-foot">{metric.note}<span className="sample-tag">MUESTRA</span></p>
          </article>
        ))}
      </section>
      <section className="content-card" id="envios" aria-labelledby="shipments-title">
        <div className="card-heading">
          <div><h2 id="shipments-title">Envíos recientes</h2><p>Actividad ilustrativa · no corresponde a envíos reales</p></div>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>REFERENCIA</th><th>DESTINO</th><th>CENTRO</th><th>TRANSPORTISTA</th><th>ESTADO</th></tr></thead>
          <tbody>{shipments.map(([reference, destination, center, carrier, status, tone]) => (
            <tr key={reference}><td className="reference">{reference}</td><td>{destination}</td><td>{center}</td><td>{carrier}</td><td><span className={`shipment-status ${tone}`}>{status}</span></td></tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="modules-grid" aria-label="Otros módulos internos">
        <article className="module-card" id="inventario"><p className="eyebrow">MÓDULO</p><h2>Inventario</h2><p>La vista unificada de existencias está pendiente de integración con los sistemas de almacén.</p><span className="module-status">Próximamente · Sin conexión</span></article>
        <article className="module-card"><p className="eyebrow">MÓDULO</p><h2>Directorio de proveedores</h2><p>Consulta y actualiza proveedores autorizados en el directorio de demostración.</p><Link className="text-link" href="/suppliers">Abrir proveedores <span aria-hidden="true">→</span></Link></article>
        <article className="module-card"><p className="eyebrow">MÓDULO</p><h2>Análisis de incidencias</h2><p>Valida un CSV y consulta únicamente métricas agregadas.</p><Link className="text-link" href="/incidents">Abrir analizador <span aria-hidden="true">→</span></Link></article>
      </section>
    </>
  );
}