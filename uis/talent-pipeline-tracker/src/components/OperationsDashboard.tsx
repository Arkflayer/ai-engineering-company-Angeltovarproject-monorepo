import Link from 'next/link';

const shipments = [
  ['TF-DEMO-10482', 'Madrid, ES', 'Zaragoza', 'SEUR', 'Entregado', 'delivered'],
  ['TF-DEMO-10481', 'Valencia, ES', 'Zaragoza', 'MRW', 'En tránsito', 'transit'],
  ['TF-DEMO-10480', 'San Diego, US', 'Los Ángeles', 'UPS', 'Incidencia', 'attention'],
  ['TF-DEMO-10479', 'Barcelona, ES', 'Zaragoza', 'DHL', 'En tránsito', 'transit'],
];

const metrics = [
  { label: 'Envíos procesados', value: '1.284', note: '↑ 8,2% vs. periodo anterior', symbol: '↗', tone: 'green' },
  { label: 'Entregas a tiempo', value: '96,8%', note: '↑ 1,4% vs. periodo anterior', symbol: '✓', tone: 'blue' },
  { label: 'En tránsito', value: '327', note: 'En todos los centros', symbol: '⇢', tone: 'amber' },
  { label: 'Incidencias abiertas', value: '12', note: 'Requieren seguimiento', symbol: '!', tone: 'rose' },
];

export default function OperationsDashboard() {
  return (
    <>
      <header className="admin-topbar"><div className="admin-breadcrumb">TrackFlow <span aria-hidden="true">/</span> Administración</div><span className="admin-status-pill"><span aria-hidden="true" /> Entorno de demostración</span></header>
      <section className="admin-page-heading">
        <div><p className="admin-eyebrow">VISTA GENERAL</p><h1>Buenos días, equipo</h1><p className="admin-page-description">Un espacio único para gestionar talento y operaciones internas.</p></div>
        <span className="admin-date-button">Últimos 7 días</span>
      </section>
      <section className="admin-demo-notice" aria-label="Aviso sobre los datos"><span aria-hidden="true">i</span><p><strong>Datos de muestra.</strong> El panel operativo no está conectado a inventario ni a sistemas de seguimiento en tiempo real.</p></section>
      <section className="admin-metrics-grid" aria-label="Indicadores de demostración">
        {metrics.map((metric) => <article className="admin-metric-card" key={metric.label}><div className="admin-metric-top"><span>{metric.label}</span><span className={`admin-metric-icon ${metric.tone}`} aria-hidden="true">{metric.symbol}</span></div><p className="admin-metric-value">{metric.value}</p><p className="admin-metric-foot">{metric.note}<span className="admin-sample-tag">MUESTRA</span></p></article>)}
      </section>
      <section className="admin-content-card" aria-labelledby="admin-shipments-title">
        <div className="admin-card-heading"><div><h2 id="admin-shipments-title">Envíos recientes</h2><p>Actividad ilustrativa · no corresponde a envíos reales</p></div></div>
        <div className="admin-table-wrap"><table><thead><tr><th>REFERENCIA</th><th>DESTINO</th><th>CENTRO</th><th>TRANSPORTISTA</th><th>ESTADO</th></tr></thead><tbody>{shipments.map(([reference, destination, center, carrier, status, tone]) => <tr key={reference}><td className="admin-reference">{reference}</td><td>{destination}</td><td>{center}</td><td>{carrier}</td><td><span className={`admin-shipment-status ${tone}`}>{status}</span></td></tr>)}</tbody></table></div>
      </section>
      <section className="admin-modules-grid" aria-label="Módulos administrativos">
        <article className="admin-module-card"><p className="admin-eyebrow">TALENTO</p><h2>Pipeline de candidaturas</h2><p>Consulta candidaturas, filtra por estado y etapa y registra nuevas oportunidades.</p><Link className="admin-text-link" href="/">Abrir candidaturas <span aria-hidden="true">→</span></Link></article>
        <article className="admin-module-card"><p className="admin-eyebrow">PROVEEDORES</p><h2>Directorio operativo</h2><p>Consulta y actualiza proveedores autorizados mediante la API autenticada.</p><Link className="admin-text-link" href="/suppliers">Abrir proveedores <span aria-hidden="true">→</span></Link></article>
        <article className="admin-module-card"><p className="admin-eyebrow">INCIDENCIAS</p><h2>Análisis agregado</h2><p>Valida un CSV y consulta únicamente métricas agregadas con una sesión autenticada.</p><Link className="admin-text-link" href="/incidents">Abrir analizador <span aria-hidden="true">→</span></Link></article>
      </section>
    </>
  );
}
