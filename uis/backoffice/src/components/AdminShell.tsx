'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang, type Lang } from '@/lib/lang';
const NAV_LOCALE: Record<string, { es: string; en: string }> = {
  operations: { es: 'Operaciones', en: 'Operations' },
  candidates: { es: 'Candidaturas', en: 'Candidates' },
  suppliers:  { es: 'Proveedores', en: 'Suppliers' },
  incidents:  { es: 'Incidencias', en: 'Incidents' },
};
const navigation = [
  { href: '/', labelKey: 'operations' },
  { href: '/candidates', labelKey: 'candidates' },
  { href: '/suppliers', labelKey: 'suppliers' },
  { href: '/incidents', labelKey: 'incidents' },
];
export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { lang, setLang } = useLang();
  useEffect(() => { document.documentElement?.setAttribute('lang', lang); }, [lang]);
  function toggleLang() { setLang(lang === 'es' ? 'en' : 'es'); }
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password') return <>{children}</>;
  if (pathname === '/account/profile') return <div className="min-h-screen pt-8 pb-4 px-5" style={{ background: "#f3f7f4" }}><div className="w-full max-w-3xl mx-auto">{children}</div></div>;
  return <div className="admin-shell"><a className="admin-skip-link" href="#admin-main">{(lang === 'es') ? 'Saltar al contenido' : 'Skip to content'}</a><aside className="admin-sidebar" aria-label={(lang === 'es') ? 'Navegación administrativa' : 'Admin navigation'}><Link className="admin-brand" href="/" aria-label={(lang === 'es') ? 'TrackFlow, administración' : 'TrackFlow, admin'}><span className="admin-brand-mark" aria-hidden="true">T</span><span>TrackFlow<span className="admin-brand-subtitle">{(lang === 'es') ? 'ADMINISTRACIÓN' : 'ADMINISTRATION'}</span></span></Link><p className="admin-nav-label">{(lang === 'es') ? 'ESPACIO DE TRABAJO' : 'WORKSPACE'}</p><nav className="admin-nav" aria-label={(lang === 'es') ? 'Principal' : 'Main navigation'}>{navigation.map((item) => { const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link className={`admin-nav-item${active ? ' active' : ''}`} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}>{NAV_LOCALE[item.labelKey]?.[lang] ?? item.labelKey}</Link>; })}</nav><div className="admin-sidebar-footer"><span className="admin-avatar" aria-hidden="true">TF</span><span><strong>{(lang === 'es') ? 'Equipo TrackFlow' : 'TrackFlow Team'}</strong><small>{(lang === 'es') ? 'Espacio interno · Demo' : 'Internal space · Demo'}</small><Link className="text-link" href="/account/profile">{(lang === 'es') ? 'Mi perfil' : 'My profile'}</Link></span><button type="button" onClick={logout} className="secondary-button">{(lang === 'es') ? 'Cerrar sesión' : 'Sign out'}</button></div></aside><main id="admin-main" className="admin-main"><div className="admin-topbar"><div className="admin-topbar-left"><span className="admin-topbar-brand">TrackFlow</span></div><div className="admin-topbar-right"><button type="button" className="admin-lang-toggle" onClick={toggleLang} title={(lang === 'es') ? 'Switch to English' : 'Cambiar a Español'}><span className={lang === 'es' ? 'active' : ''}>ES</span><span className="sep"> / </span><span className={lang === 'en' ? 'active' : ''}>EN</span></button></div></div>{children}<footer className="admin-footer">TrackFlow Tech <span aria-hidden="true">&middot;</span> {(lang === 'es') ? 'Espacio administrativo' : 'Admin space'}</footer></main></div>;
}