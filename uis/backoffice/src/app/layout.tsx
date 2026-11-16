import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";
import "./profile.css";

export const metadata: Metadata = {
  title: "TrackFlow | Operaciones",
  description: "Espacio interno de operaciones de TrackFlow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}