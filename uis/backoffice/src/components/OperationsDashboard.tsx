'use client';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

const shipments = [
  ['TF-DEMO-10482', 'Madrid, ES', 'Zaragoza', 'SEUR', 'Entregado', 'delivered'],
  ['TF-DEMO-10481', 'Valencia, ES', 'Zaragoza', 'MRW', 'En tránsito', 'transit'],
  ['TF-DEMO-10480', 'San Diego, US', 'Los Ángeles', 'UPS', 'Incidencia', 'attention'],
  ['TF-DEMO-10479', 'Barcelona, ES', 'Zaragoza', 'DHL', 'En tránsito', 'transit'],
];

const LOCALE: Record<string, { es: string; en: string }> = {
  breadcrumb:       { es: 'TrackFlow / Administración', en: 'TrackFlow / Administration' },
  demoEnv:          { es: 'Entorno de demostración', en: 'Demo environment' },
  overview:         { es: 'VISTA GENERAL', en: 'OVERVIEW' },
  greeting:         { es: 'Buenos días, equipo', en: 'Good morning, team' },
  description:      { es: 'Un espacio único para gestionar talento y operaciones internas.', en: 'A single space to manage talent and internal operations.' },
  last7Days:        { es: 'Últimos 7 días', en: 'Last 7 days' },
  dataNotice:       { es: 'Aviso sobre los datos', en: 'Data notice' },
  dataNoticeText:   { es: 'Datos de muestra. El panel operativo no está conectado a inventario ni a sistemas de seguimiento en tiempo real.', en: 'Sample data. The operations panel is not connected to inventory or real-time tracking systems.' },
  metricsLabel:     { es: 'Indicadores de demostración', en: 'Demo indicators' },
  shipmentsProcessed: { es: 'Envíos procesados', en: 'Shipments processed' },
  onTimeDeliveries: { es: 'Entregas a tiempo', en: 'On-time deliveries' },
  inTransit:        { es: 'En tránsito', en: 'In transit' },
  openIncidents:    { es: 'Incidencias abiertas', en: 'Open incidents' },
  vsPrevious:       { es: 'vs. periodo anterior', en: 'vs. previous period' },
  allCenters:       { es: 'En todos los centros', en: 'Across all centers' },
  needsFollowup:    { es: 'Requieren seguimiento', en: 'Require follow-up' },
  sampleTag:        { es: 'MUESTRA', en: 'SAMPLE' },
  recentShipments:  { es: 'Envíos recientes', en: 'Recent shipments' },
  illustrative:     { es: 'Actividad ilustrativa · no corresponde a envíos reales', en: 'Illustrative activity · does not correspond to real shipments' },
  ref:              { es: 'REFERENCIA', en: 'REFERENCE' },
  destination:      { es: 'DESTINO', en: 'DESTINATION' },
  center:           { es: 'CENTRO', en: 'CENTER' },
  carrier:          { es: 'TRANSPORTISTA', en: 'CARRIER' },
  status:           { es: 'ESTADO', en: 'STATUS' },
  modulesLabel:     { es: 'Módulos administrativos', en: 'Admin modules' },
  talent:           { es: 'TALENTO', en: 'TALENT' },
  talentTitle:      { es: 'Pipeline de candidaturas', en: 'Candidate pipeline' },
  talentDesc:       { es: 'Consulta candidaturas, filtra por estado y etapa y registra nuevas oportunidades.', en: 'View candidates, filter by status and stage, and register new opportunities.' },
  talentLink:       { es: 'Abrir candidaturas', en: 'Open candidates' },
  suppliers:        { es: 'PROVEEDORES', en: 'SUPPLIERS' },
  suppliersTitle:   { es: 'Directorio operativo', en: 'Supplier directory' },
  suppliersDesc:    { es: 'Consulta y actualiza proveedores autorizados mediante la API autenticada.', en: 'View and update authorized suppliers through the authenticated API.' },
  suppliersLink:    { es: 'Abrir proveedores', en: 'Open suppliers' },
  incidents:        { es: 'INCIDENCIAS', en: 'INCIDENTS' },
  incidentsTitle:   { es: 'Análisis agregado', en: 'Aggregated analysis' },
  incidentsDesc:    { es: 'Valida un CSV y consulta únicamente métricas agregadas con una sesión autenticada.', en: 'Validate a CSV and query only aggregated metrics with an authenticated session.' },
  incidentsLink:    { es: 'Abrir analizador', en: 'Open analyzer' },
};

export default function OperationsDashboard() {
  const { lang, setLang } = useLang();
  const t = (key: string): string => LOCALE[key]?.[lang] ?? key;
  const metricsDefs = [
    { key: 'shipmentsProcessed', value: '1.284', note: '↗ ' + t('vsPrevious'), symbol: '↗', tone: 'green' },
    { key: 'onTimeDeliveries', value: '96,8%', note: '↑ ' + t('vsPrevious'), symbol: '✓', tone: 'blue' },
    { key: 'inTransit', value: '327', note: t('allCenters'), symbol: '⇢', tone: 'amber' },
    { key: 'openIncidents', value: '12', note: t('needsFollowup'), symbol: '!', tone: 'rose' },
  ];

  return (
    <>
      <header className="admin-topbar"><div className="admin-breadcrumb">{t('breadcrumb')}</div><span className="admin-status-pill"><span aria-hidden="true" /> {t('demoEnv')}</span></header>
      <section className="admin-page-heading">
        <div><p className="admin-eyebrow">{t('overview')}</p><h1>{t('greeting')}</h1><p className="admin-page-description">{t('description')}</p></div>
        <span className="admin-date-button">{t('last7Days')}</span>
      </section>
      <section className="admin-demo-notice" aria-label={t('dataNotice')}><span aria-hidden="true">i</span><p><strong>{t('dataNoticeText')}</strong></p></section>
      <section className="admin-metrics-grid" aria-label={t('metricsLabel')}>
        {metricsDefs.map((m) => <article className="admin-metric-card" key={m.key}><div className="admin-metric-top"><span>{t(m.key)}</span><span className={`admin-metric-icon ${m.tone}`} aria-hidden="true">{m.symbol}</span></div><p className="admin-metric-value">{m.value}</p><p className="admin-metric-foot">{m.note}<span className="admin-sample-tag">{t('sampleTag')}</span></p></article>)}
      </section>
      <section className="admin-content-card" aria-labelledby="admin-shipments-title">
        <div className="admin-card-heading"><div><h2 id="admin-shipments-title">{t('recentShipments')}</h2><p>{t('illustrative')}</p></div></div>
        <div className="admin-table-wrap"><table><thead><tr><th>{t('ref')}</th><th>{t('destination')}</th><th>{t('center')}</th><th>{t('carrier')}</th><th>{t('status')}</th></tr></thead><tbody>{shipments.map(([reference, destination, center, carrier, status, tone]) => <tr key={reference}><td className="admin-reference">{reference}</td><td>{destination}</td><td>{center}</td><td>{carrier}</td><td><span className={`admin-shipment-status ${tone}`}>{status}</span></td></tr>)}</tbody></table></div>
      </section>
      <section className="admin-modules-grid" aria-label={t('modulesLabel')}>
        <article className="admin-module-card"><p className="admin-eyebrow">{t('talent')}</p><h2>{t('talentTitle')}</h2><p>{t('talentDesc')}</p><Link className="admin-text-link" href="/candidates">{t('talentLink')} <span aria-hidden="true">→</span></Link></article>
        <article className="admin-module-card"><p className="admin-eyebrow">{t('suppliers')}</p><h2>{t('suppliersTitle')}</h2><p>{t('suppliersDesc')}</p><Link className="admin-text-link" href="/suppliers">{t('suppliersLink')} <span aria-hidden="true">→</span></Link></article>
        <article className="admin-module-card"><p className="admin-eyebrow">{t('incidents')}</p><h2>{t('incidentsTitle')}</h2><p>{t('incidentsDesc')}</p><Link className="admin-text-link" href="/incidents">{t('incidentsLink')} <span aria-hidden="true">→</span></Link></article>
      </section>
    </>
  );
}
