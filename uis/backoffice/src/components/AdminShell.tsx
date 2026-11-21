'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLang, type Lang } from '@/lib/lang';
const navigation = [
  { href: '/', label: 'Operaciones', symbol: 'O' },
  { href: '/candidates', label: 'Candidaturas', symbol: 'C' },
  { href: '/suppliers', label: 'Proveedores', symbol: 'P' },
  { href: '/incidents', label: 'Incidencias', symbol: 'I' },
];
export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { lang, setLang } = useLang();
  function toggleLang() { setLang(lang === 'es' ? 'en' : 'es'); }
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password') return <>{children}</>;
  if (pathname === '/account/profile') return <div className="min-h-screen pt-8 pb-4 px-5" style={{ background: "#f3f7f4" }}><div className="w-full max-w-3xl mx-auto">{children}</div></div>;
  return <div className="admin-shell"><a className="admin-skip-link" href="#admin-main">Saltar al contenido</a><aside className="admin-sidebar" aria-label="Navegaci&oacute;n administrativa"><Link className="admin-brand" href="/" aria-label="TrackFlow, administraci&oacute;n"><span className="admin-brand-mark" aria-hidden="true">T</span><span>TrackFlow<span className="admin-brand-subtitle">ADMINISTRACI&Oacute;N</span></span></Link><p className="admin-nav-label">ESPACIO DE TRABAJO</p><nav className="admin-nav" aria-label="Principal">{navigation.map((item) => { const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link className={`admin-nav-item${active ? ' active' : ''}`} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}><span aria-hidden="true">{item.symbol}</span>{item.label}</Link>; })}</nav><div className="admin-sidebar-footer"><span className="admin-avatar" aria-hidden="true">TF</span><span><strong>Equipo TrackFlow</strong><small>Espacio interno &middot; Demo</small><Link className="text-link" href="/account/profile">Mi perfil</Link></span><button type="button" onClick={logout} className="secondary-button">Cerrar sesi&oacute;n</button></div></aside><main id="admin-main" className="admin-main"><div className="admin-topbar"><div className="admin-topbar-left"><span className="admin-topbar-brand">TrackFlow</span></div><div className="admin-topbar-right"><button type="button" className="admin-lang-toggle" onClick={toggleLang} title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}><span className={lang === 'es' ? 'active' : ''}>ES</span><span className="sep"> / </span><span className={lang === 'en' ? 'active' : ''}>EN</span></button></div></div>{children}<footer className="admin-footer">TrackFlow Tech <span aria-hidden="true">&middot;</span> Espacio administrativo</footer></main></div>;
}