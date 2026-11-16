'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const AUTH_API = (process.env.NEXT_PUBLIC_TRACKFLOW_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'trackflow-access-token';

type AuthValue = {
  token: string;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name?: string; phone?: string; address?: string }) => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthValue | null>(null);

async function readError(response: Response) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) return detail.map((item) => item && typeof item === 'object' && 'msg' in item ? item.msg : '').filter(Boolean).join(' ');
    }
  } catch { /* Usa el estado HTTP como alternativa. */ }
  return `La solicitud no se completó (HTTP ${response.status}).`;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken('');
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    let active = true;
    const saved = window.localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      Promise.resolve().then(() => { if (active) setReady(true); });
      return () => { active = false; };
    }
    fetch(`${AUTH_API}/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
      .then((response) => { if (!response.ok) throw new Error('Sesión no válida.'); return response.json(); })
      .then(() => { if (active) setToken(saved); })
      .catch(() => { window.localStorage.removeItem(TOKEN_KEY); if (active) setToken(''); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expired = () => {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken('');
      router.replace('/login');
    };
    window.addEventListener('trackflow:unauthorized', expired);
    return () => window.removeEventListener('trackflow:unauthorized', expired);
  }, [router]);

  useEffect(() => {
    if (ready && !token && !isAuthPage) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (ready && token && isAuthPage) router.replace('/');
  }, [isAuthPage, pathname, ready, router, token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${AUTH_API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(await readError(response));
    const result = await response.json() as { access_token: string };
    window.localStorage.setItem(TOKEN_KEY, result.access_token);
    setToken(result.access_token);
  }, []);

  const register = useCallback(async (input: { email: string; password: string; name?: string; phone?: string; address?: string }) => {
    const response = await fetch(`${AUTH_API}/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await readError(response));
    await login(input.email, input.password);
  }, [login]);

  const value = useMemo(() => ({ token, ready, login, register, logout }), [token, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{ready && (token || isAuthPage) ? children : <main className="min-h-screen grid place-items-center text-gray-600">Comprobando sesión…</main>}</AuthContext.Provider>;
}
