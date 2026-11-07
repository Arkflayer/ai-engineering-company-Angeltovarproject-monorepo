import type { Metadata } from "next";
import Link from "next/link";
import BackofficeNav from "@/components/BackofficeNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackFlow | Operaciones",
  description: "Espacio interno de operaciones de TrackFlow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main-content">Saltar al contenido</a>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Navegación del backoffice">
            <Link className="brand" href="/" aria-label="TrackFlow, inicio del backoffice">
              <span className="brand-mark" aria-hidden="true">T</span>
              <span>TrackFlow<span className="brand-subtitle">OPERACIONES</span></span>
            </Link>
            <p className="nav-label">ESPACIO DE TRABAJO</p>
            <BackofficeNav />
            <div className="sidebar-footer">
              <span className="avatar" aria-hidden="true">TF</span>
              <span><strong>Equipo TrackFlow</strong><small>Vista interna · Demo</small></span>
            </div>
          </aside>
          <main id="main-content" className="main-content">
            {children}
            <footer className="page-footer">TrackFlow Tech <span aria-hidden="true">·</span> Prototipo interno</footer>
          </main>
        </div>
      </body>
    </html>
  );
}