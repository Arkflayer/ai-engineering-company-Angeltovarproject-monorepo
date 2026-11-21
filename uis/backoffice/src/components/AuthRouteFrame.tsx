"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/components/AdminShell";
export default function AuthRouteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}