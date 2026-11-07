import type { Metadata } from "next";
import SuppliersWorkspace from "@/components/SuppliersWorkspace";

export const metadata: Metadata = { title: "Proveedores | TrackFlow" };

export default function SuppliersPage() {
  return <SuppliersWorkspace />;
}