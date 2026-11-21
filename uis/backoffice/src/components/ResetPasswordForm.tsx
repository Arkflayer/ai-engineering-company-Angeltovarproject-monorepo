"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { resetPassword } from "@/lib/api";

/* ── Auth card wrapper (same as AuthForms) ── */
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

function ResetPasswordFormInner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("El enlace no es válido: falta el token de restablecimiento.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("new-password") || "");
    const confirm = String(data.get("confirm-password") || "");
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length < 12) {
      setError("La contraseña debe tener al menos 12 bytes UTF-8.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo restablecer la contraseña.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return <AuthCard>
      <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
      <h1 className="mt-2 text-2xl font-bold">Enlace inválido</h1>
      <p className="mt-3 text-sm text-gray-600">El enlace de restablecimiento no contiene un token válido. Solicita uno nuevo.</p>
      <p className="auth-switch mt-4 text-center text-sm text-gray-500">
        <Link href="/forgot-password" className="font-bold underline text-gray-900 hover:text-blue-600">Solicitar nuevo enlace</Link>
      </p>
    </AuthCard>;
  }

  if (success) {
    return <AuthCard>
      <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
      <h1 className="mt-2 text-2xl font-bold">Contraseña actualizada</h1>
      <p className="mt-3 text-sm text-gray-600">Tu contraseña se ha restablecido correctamente.</p>
      <p className="mt-2 text-sm text-gray-500">Ahora puedes iniciar sesión con tu nueva contraseña.</p>
      <p className="auth-switch mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="font-bold underline text-gray-900 hover:text-blue-600">Iniciar sesión</Link>
      </p>
    </AuthCard>;
  }

  return <AuthCard>
    <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
    <h1 className="mt-2 text-2xl font-bold">Restablecer contraseña</h1>
    <p className="mt-1 text-sm text-gray-500">Elige una nueva contraseña para tu cuenta.</p>
    <form className="auth-fields grid gap-4 mt-5" onSubmit={submit}>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
        Nueva contraseña
        <input
          name="new-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-gray-600">
        Confirmar contraseña
        <input
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none"
        />
      </label>
      <button className="auth-submit w-full h-12 inline-flex items-center justify-center gap-2 px-5 border rounded-lg text-sm font-bold" disabled={busy}>
        {busy ? "Restableciendo…" : "Restablecer contraseña"}
      </button>
    </form>
    {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
    <p className="auth-switch mt-4 text-center text-sm text-gray-500">
      <Link href="/login" className="font-bold underline text-gray-900 hover:text-blue-600">Volver a inicio de sesión</Link>
    </p>
  </AuthCard>;
}

export default function ResetPasswordForm() {
  return <Suspense fallback={<div className="auth-loading min-h-screen grid place-items-center text-sm text-gray-500">Cargando…</div>}>
    <ResetPasswordFormInner />
  </Suspense>;
}