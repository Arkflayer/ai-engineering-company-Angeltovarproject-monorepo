"use client";

import { Suspense, type ReactNode } from "react";
import { AuthProvider as Provider } from "@/lib/auth";
import AuthRouteFrame from "@/components/AuthRouteFrame";

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="auth-loading">Comprobando sesión…</div>}><Provider><AuthRouteFrame>{children}</AuthRouteFrame></Provider></Suspense>;
}
