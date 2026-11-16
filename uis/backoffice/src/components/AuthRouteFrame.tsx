"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import BackofficeNav from "@/components/BackofficeNav";

export default function AuthRouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  if (pathname === "/login" || pathname === "/register") return <>{children}</>;
  if (pathname === "/account/profile") return <div className="profile-route"><div className="profile-width">{children}</div></div>;
  return <><a className="skip-link" href="#main-content">Saltar al contenido</a><div className="app-shell"><aside className="sidebar" aria-label="Navegación del backoffice"><Link className="brand" href="/" aria-label="TrackFlow, inicio del backoffice"><span className="brand-mark" aria-hidden="true">T</span><span>TrackFlow<span className="brand-subtitle">OPERACIONES</span></span></Link><p className="nav-label">ESPACIO DE TRABAJO</p><BackofficeNav /><div className="sidebar-footer"><span className="avatar" aria-hidden="true">TF</span><span><strong>Equipo TrackFlow</strong><small>Vista interna · Demo</small><Link href="/account/profile" className="text-link">Mi perfil</Link></span><button type="button" className="frame-logout" onClick={logout}>Salir</button></div></aside><main id="main-content" className="main-content">{children}<footer className="page-footer">TrackFlow Tech <span aria-hidden="true">·</span> Prototipo interno</footer></main></div></>;
}
