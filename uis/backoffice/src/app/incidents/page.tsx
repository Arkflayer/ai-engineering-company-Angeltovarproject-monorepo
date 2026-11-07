import type { Metadata } from "next";
import IncidentsWorkspace from "@/components/IncidentsWorkspace";

export const metadata: Metadata = { title: "Análisis de incidencias | TrackFlow" };

export default function IncidentsPage() {
  return <IncidentsWorkspace />;
}