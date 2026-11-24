"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getApiBaseUrl, ApiError, clearStoredToken, login as requestLogin, register as requestRegister, setStoredToken } from "@/lib/api";

interface AuthContextValue {
  token: string;
  ready: boolean;
  login(email: string, password: string): Promise<void>;
  register(input: { email: string; password: string; name?: string; phone?: string; address?: string }): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";
  const isInAuthFlow = isAuthPage || pathname.startsWith("/auth/");

  const logout = useCallback(() => {
    clearStoredToken();
    setToken("");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let active = true;
    const stored = window.localStorage.getItem("trackflow-access-token");
    if (!stored) {
      Promise.resolve().then(() => { if (active) setReady(true); });
      return () => { active = false; };
    }
    fetch(`${getApiBaseUrl()}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then((response) => {
        if (!response.ok) throw new ApiError("La sesión no es válida.", response.status);
        return response.json();
      })
      .then(() => { if (active) setToken(stored); })
      .catch(() => { clearStoredToken(); if (active) setToken(""); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      clearStoredToken();
      setToken("");
      router.replace("/login");
    };
    window.addEventListener("trackflow:unauthorized", handleExpired);
    return () => window.removeEventListener("trackflow:unauthorized", handleExpired);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (!token && !isInAuthFlow) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isInAuthFlow, pathname, ready, router, token]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await requestLogin(email, password);
    setStoredToken(result.access_token);
    setToken(result.access_token);
  }, []);

  const register = useCallback(async (input: { email: string; password: string; name?: string; phone?: string; address?: string }) => {
    await requestRegister(input);
    await login(input.email, input.password);
  }, [login]);

  const value = useMemo(() => ({ token, ready, login, register, logout }), [token, ready, login, register, logout]);
  const content = isAuthPage
    ? children
    : !ready || (!token && !isInAuthFlow)
      ? <div className="auth-loading" role="status">Comprobando sesiÃ³nâ€¦</div>
      : children;

  return <AuthContext.Provider value={value}>{content}</AuthContext.Provider>;
}


