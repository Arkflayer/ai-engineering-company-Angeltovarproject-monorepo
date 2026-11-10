"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Resumen", symbol: "▦" },
  { href: "/suppliers", label: "Proveedores", symbol: "⇄" },
  { href: "/incidents", label: "Análisis de incidencias", symbol: "!" },
];

export default function BackofficeNav() {
  const pathname = usePathname();

  return (
    <nav className="primary-nav" aria-label="Principal">
      {navigation.map((item) => {
        const active = pathname === item.href;
        return (
          <Link className={`nav-item${active ? " active" : ""}`} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            <span aria-hidden="true">{item.symbol}</span>{item.label}
          </Link>
        );
      })}
    </nav>
  );
}