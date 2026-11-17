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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "password" | "name" | "phone" | "address", string>>>({});
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (new TextEncoder().encode(password).length < 12 || new TextEncoder().encode(password).length > 72) {
      setError("");
      setFieldErrors({ password: "La contraseña debe tener entre 12 y 72 bytes UTF-8." });
      return;
    }
    setBusy(true); setError(""); setFieldErrors({});
    try {
      await register({ email: String(data.get("email")), password, name: String(data.get("name") || "") || undefined, phone: String(data.get("phone") || "") || undefined, address: String(data.get("address") || "") || undefined });
      router.replace("/");
    } catch (reason) {
      if (reason instanceof Error && "fieldErrors" in reason && reason.fieldErrors && typeof reason.fieldErrors === "object") {
        setFieldErrors(reason.fieldErrors as typeof fieldErrors);
        setError(Object.keys(reason.fieldErrors).length ? "Revisa los campos indicados." : reason.message);
      } else {
        setError(reason instanceof Error ? reason.message : "No se pudo crear la cuenta.");
      }
    } finally { setBusy(false); }
  }
  const fieldError = (field: keyof typeof fieldErrors) => fieldErrors[field]
    ? <span className="analysis-message error" id={`${field}-error`}>{fieldErrors[field]}</span>
    : null;
  return <main className="auth-page"><section className="content-card auth-panel"><p className="eyebrow">TRACKFLOW · OPERACIONES</p><h1>Crear cuenta</h1><p className="page-description">Completa tus datos para registrarte.</p><form className="auth-fields" onSubmit={submit} noValidate>
    <label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, email: undefined }))} />{fieldError("email")}</label>
    <label>Contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : "password-help"} onChange={() => setFieldErrors((current) => ({ ...current, password: undefined }))} /><span className="field-help" id="password-help">Mínimo 12 y máximo 72 bytes UTF-8.</span>{fieldError("password")}</label>
    <label>Nombre<input name="name" autoComplete="name" maxLength={120} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, name: undefined }))} />{fieldError("name")}</label>
    <label>Teléfono<input name="phone" type="tel" autoComplete="tel" maxLength={40} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, phone: undefined }))} />{fieldError("phone")}</label>
    <label>Dirección<input name="address" autoComplete="street-address" maxLength={500} aria-invalid={Boolean(fieldErrors.address)} aria-describedby={fieldErrors.address ? "address-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, address: undefined }))} />{fieldError("address")}</label>
    <button className="primary-button" disabled={busy || !ready}>{busy ? "Creando cuenta…" : "Crear cuenta"}</button></form>{error && <p className="analysis-message error" role="alert">{error}</p>}<p className="auth-switch">¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link></p></section></main>;
}

export function LoginView() { return <Suspense fallback={<div className="auth-loading">Cargando…</div>}><LoginForm /></Suspense>; }
export function RegisterView() { return <RegisterForm />; }
