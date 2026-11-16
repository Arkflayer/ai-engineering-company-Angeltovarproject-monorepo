import type { Metadata } from "next";
import "./globals.css";
import "./public.css";

export const metadata: Metadata = {
  title: "TrackFlow — Smart e-commerce logistics",
  description: "Fulfillment, warehousing, last-mile delivery, and reverse logistics for e-commerce businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
