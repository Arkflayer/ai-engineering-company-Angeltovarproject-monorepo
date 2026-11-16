import type { Metadata } from "next";
import "./globals.css";
import "./admin.css";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "TrackFlow | Administración",
  description: "Espacio interno de operaciones, talento y proveedores de TrackFlow Tech.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AdminShell>{children}</AdminShell></body>
    </html>
  );
}
