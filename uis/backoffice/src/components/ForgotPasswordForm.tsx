"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    setBusy(true);
    setError("");
    try {
      await forgotPassword(email);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error al enviar la solicitud.");
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  if (sent) {
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
            <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
            <h1 className="mt-2 text-2xl font-bold">Correo enviado</h1>
            <p className="mt-4 text-sm text-gray-600">
              Si el correo existe, recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
            <p className="auth-switch mt-4 text-center text-sm text-gray-500">
              <Link href="/login" className="font-bold underline text-gray-900 hover:text-blue-600">Volver a inicio de sesión</Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

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
          <span className="eyebrow block mt-4 text-xs font-bold tracking-widest uppercase">TRACKFLOW · OPERACIONES</span>
          <h1 className="mt-2 text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
          </p>
          <form className="auth-fields grid gap-4 mt-5" onSubmit={submit}>
            <label className="grid gap-1 text-xs font-semibold text-gray-600">
              Correo electrónico
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none"
              />
            </label>
            <button
              className="auth-submit w-full h-12 inline-flex items-center justify-center gap-2 px-5 border rounded-lg text-sm font-bold"
              disabled={busy}
            >
              {busy ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
          {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
          <p className="auth-switch mt-4 text-center text-sm text-gray-500">
            ¿Recordaste tu contraseña? <Link href="/login" className="font-bold underline text-gray-900 hover:text-blue-600">Iniciar sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}