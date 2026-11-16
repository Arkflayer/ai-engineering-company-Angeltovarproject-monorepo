import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/auth";

export const metadata: Metadata = {
  title: "TrackFlow — Talent Pipeline Tracker",
  description: "Herramienta interna de gestión de candidaturas — TrackFlow Tech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
