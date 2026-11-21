"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

/* ── Auth card wrapper ── */
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page min-h-screen grid place-items-center p-6 bg-white">
      <section className="auth-card w-full max-w-md bg-white">
        <div className="pt-9 px-8 pb-7">
          <Link
            href="/"
            className="auth-brand inline-flex items-center gap-2 text-lg font-extrabold tracking-tighter leading-none"
          >
            <span aria-hidden="true" className="text-xl">📦</span>TrackFlow
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}

/* ── Login ── */
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
  return <AuthCard>
        <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
        <h1 className="mt-2 text-2xl font-bold">Iniciar sesión</h1>
    <form className="auth-fields grid gap-4 mt-5" onSubmit={submit}>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Correo electrónico
        <input name="email" type="email" autoComplete="username" required className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Contraseña
        <input name="password" type="password" autoComplete="current-password" required className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" />
      </label>
      <button className="auth-submit w-full h-12 inline-flex items-center justify-center gap-2 px-5 border rounded-lg text-sm font-bold" disabled={busy || !ready}>{busy ? "Verificando…" : "Iniciar sesión"}</button>
    </form>
    {error && <p className="analysis-message error mt-3 text-red-600 text-xs" role="alert">{error}</p>}
          <p className="mt-3 text-center text-xs"><Link href="/forgot-password" className="underline text-gray-500 hover:text-blue-600">¿Olvidaste tu contraseña?</Link></p>
    <p className="auth-switch mt-4 text-center text-sm text-gray-500">¿No tienes cuenta? <Link href="/register" className="font-bold underline text-gray-900 hover:text-blue-600">Crear una cuenta</Link></p>
  </AuthCard>;
}

/* ── Registro ── */
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
    const passwordLength = new TextEncoder().encode(password).length;
    if (password.length < 12) {
      setError("");
      setFieldErrors({ password: "La contraseña debe tener al menos 12 caracteres." });
      return;
    }
    if (passwordLength > 72) {
      setError("");
      setFieldErrors({ password: "La contraseña es demasiado larga. Usa una más corta." });
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
    ? <span className="field-error" id={`${field}-error`}>{fieldErrors[field]}</span>
    : null;
  return <AuthCard>
    <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
    <h1 className="mt-2 text-2xl font-bold">Crear cuenta</h1>
    <p className="mt-1 text-sm text-gray-500">Completa tus datos para registrarte.</p>
    <form className="auth-fields grid gap-4 mt-5" onSubmit={submit} noValidate>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Correo electrónico
        <input name="email" type="email" autoComplete="email" required maxLength={254} className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" aria-invalid={Boolean(fieldErrors.email) || undefined} aria-describedby={fieldErrors.email ? "email-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, email: undefined }))} />
        {fieldError("email")}
      </label>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Contraseña
        <input name="password" type="password" autoComplete="new-password" minLength={12} required className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" aria-invalid={Boolean(fieldErrors.password) || undefined} aria-describedby={fieldErrors.password ? "password-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, password: undefined }))} />
            {fieldError("password")}
      </label>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
        Nombre
        <input name="name" autoComplete="name" maxLength={120} className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" aria-invalid={Boolean(fieldErrors.name) || undefined} aria-describedby={fieldErrors.name ? "name-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, name: undefined }))} />
        {fieldError("name")}
      </label>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Teléfono
        <input name="phone" type="tel" autoComplete="tel" maxLength={40} className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" aria-invalid={Boolean(fieldErrors.phone) || undefined} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, phone: undefined }))} />
        {fieldError("phone")}
      </label>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Dirección
        <input name="address" autoComplete="street-address" maxLength={500} className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" aria-invalid={Boolean(fieldErrors.address) || undefined} aria-describedby={fieldErrors.address ? "address-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, address: undefined }))} />
        {fieldError("address")}
      </label>
          <button className="auth-submit w-full h-12 inline-flex items-center justify-center gap-2 px-5 border rounded-lg text-sm font-bold" disabled={busy || !ready}>{busy ? "Creando cuenta…" : "Crear cuenta"}</button>
    </form>
    {error && <p className="analysis-message error mt-3 text-red-600 text-xs" role="alert">{error}</p>}
        <p className="auth-switch mt-4 text-center text-sm text-gray-500">¿Ya tienes cuenta? <Link href="/login" className="font-bold underline text-gray-900 hover:text-blue-600">Iniciar sesión</Link></p>
  </AuthCard>;
}

export function LoginView() { return <Suspense fallback={<div className="auth-loading min-h-screen grid place-items-center text-sm text-gray-500">Cargando…</div>}><LoginForm /></Suspense>; }
export function RegisterView() { return <RegisterForm />; }
