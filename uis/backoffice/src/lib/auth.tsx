"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
  const [authCheckError, setAuthCheckError] = useState("");
  const [authCheckAttempt, setAuthCheckAttempt] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";
  const isInAuthFlow = isAuthPage || pathname.startsWith("/auth/");

  const logout = useCallback(() => {
    try {
      clearStoredToken();
    } catch {
      // La sesión en memoria se elimina aunque el almacenamiento no esté disponible.
    }
    setToken("");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let active = true;
    async function verifySession() {
      try {
        const stored = await Promise.resolve().then(() => window.localStorage.getItem("trackflow-access-token"));
        if (!active) return;
        if (!stored) {
          setReady(true);
          return;
        }
        await apiRequest("/auth/me", stored);
        if (active) setToken(stored);
      } catch (error: unknown) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          try {
            clearStoredToken();
          } catch {
            // El estado en memoria permite continuar a la página de acceso.
          }
          setToken("");
          setAuthCheckError("Tu sesión ha caducado. Inicia sesión para continuar.");
        } else {
          setAuthCheckError("No pudimos verificar tu sesión. Comprueba tu conexión e inténtalo de nuevo.");
        }
      } finally {
        if (active) setReady(true);
      }
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
  }, [authCheckAttempt]);

  useEffect(() => {
    const handleExpired = () => {
      try {
        clearStoredToken();
      } catch {
        // La sesión en memoria se elimina aunque el almacenamiento no esté disponible.
      }
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
    : !ready
      ? <div className="auth-loading" role="status">Comprobando sesión…</div>
      : authCheckError
        ? <main role="alert" className="mx-auto max-w-lg p-8 text-center">
            <h1 className="text-xl font-semibold">No pudimos comprobar tu sesión</h1>
            <p className="mt-2">{authCheckError}</p>
            <div className="mt-4 flex justify-center gap-4">
              <button type="button" className="btn-primary" onClick={() => { setReady(false); setAuthCheckError(""); setAuthCheckAttempt((attempt) => attempt + 1); }}>Reintentar</button>
              <Link className="btn-secondary" href="/login">Ir a iniciar sesión</Link>
            </div>
          </main>
        : !token && !isInAuthFlow
          ? <div className="auth-loading" role="status">Redirigiendo a iniciar sesión…</div>
          : children;

  return <AuthContext.Provider value={value}>{content}</AuthContext.Provider>;
}


