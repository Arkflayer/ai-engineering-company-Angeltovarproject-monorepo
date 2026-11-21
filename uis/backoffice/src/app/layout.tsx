import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import { LangProvider } from "@/lib/lang";
import "./globals.css";
import "./admin.css";
import "./profile.css";

export const metadata: Metadata = {
  title: "TrackFlow | Administración",
  description: "Espacio interno de operaciones, talento y proveedores de TrackFlow Tech.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body className="min-h-full flex flex-col"><LangProvider><AuthProvider>{children}</AuthProvider></LangProvider></body>
    </html>
  );
}