'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/admin/candidates', label: 'Candidaturas', symbol: '◎' },
  { href: '/admin/operations', label: 'Operaciones', symbol: '▦' },
  { href: '/admin/suppliers', label: 'Proveedores', symbol: '⇄' },
  { href: '/admin/incidents', label: 'Incidencias', symbol: '!' },
];

export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <a className="admin-skip-link" href="#admin-main">Saltar al contenido</a>
      <aside className="admin-sidebar" aria-label="Navegación administrativa">
        <Link className="admin-brand" href="/admin/candidates" aria-label="TrackFlow, administración">
          <span className="admin-brand-mark" aria-hidden="true">T</span>
          <span>TrackFlow<span className="admin-brand-subtitle">ADMINISTRACIÓN</span></span>
        </Link>
        <p className="admin-nav-label">ESPACIO DE TRABAJO</p>
        <nav className="admin-nav" aria-label="Principal">
          {navigation.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link className={`admin-nav-item${active ? ' active' : ''}`} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}>
                <span aria-hidden="true">{item.symbol}</span>{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-avatar" aria-hidden="true">TF</span>
          <span><strong>Equipo TrackFlow</strong><small>Espacio interno · Demo</small></span>
        </div>
      </aside>
      <main id="admin-main" className="admin-main">
        {children}
        <footer className="admin-footer">TrackFlow Tech <span aria-hidden="true">·</span> Espacio administrativo</footer>
      </main>
    </div>
  );
}
