"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login, ready } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await login(String(data.get("email")), String(data.get("password")));
      const next = search.get("next") || "/";
      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión.");
    } finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="content-card auth-panel"><p className="eyebrow">TRACKFLOW · OPERACIONES</p><h1>Iniciar sesión</h1><p className="page-description">Accede a tu espacio de trabajo.</p><form className="auth-fields" onSubmit={submit}><label>Correo electrónico<input name="email" type="email" autoComplete="username" required /></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label><button className="primary-button" disabled={busy || !ready}>{busy ? "Verificando…" : "Iniciar sesión"}</button></form>{error && <p className="analysis-message error" role="alert">{error}</p>}<p className="auth-switch">¿No tienes cuenta? <Link href="/register">Crear una cuenta</Link></p></section></main>;
}

function RegisterForm() {
  const { register, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (new TextEncoder().encode(password).length < 12 || new TextEncoder().encode(password).length > 72) { setError("La contraseña debe tener entre 12 y 72 bytes."); return; }
    setBusy(true); setError("");
    try {
      await register({ email: String(data.get("email")), password, name: String(data.get("name") || "") || undefined, phone: String(data.get("phone") || "") || undefined, address: String(data.get("address") || "") || undefined });
      router.replace("/");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo crear la cuenta."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="content-card auth-panel"><p className="eyebrow">TRACKFLOW · OPERACIONES</p><h1>Crear cuenta</h1><p className="page-description">Completa tus datos para registrarte.</p><form className="auth-fields" onSubmit={submit}><label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label><label>Contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} required /><span className="field-help">Mínimo 12 y máximo 72 bytes UTF-8.</span></label><label>Nombre<input name="name" autoComplete="name" maxLength={120} /></label><label>Teléfono<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label>Dirección<input name="address" autoComplete="street-address" maxLength={240} /></label><button className="primary-button" disabled={busy || !ready}>{busy ? "Creando cuenta…" : "Crear cuenta"}</button></form>{error && <p className="analysis-message error" role="alert">{error}</p>}<p className="auth-switch">¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link></p></section></main>;
}

export function LoginView() { return <Suspense fallback={<div className="auth-loading">Cargando…</div>}><LoginForm /></Suspense>; }
export function RegisterView() { return <RegisterForm />; }
