"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { changePassword } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ChangePasswordForm() {
  const { token, logout } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get("current-password") || "");
    const newPassword = String(data.get("new-password") || "");
    const confirm = String(data.get("confirm-password") || "");
    if (newPassword !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length < 12) {
      setError("La contraseña debe tener al menos 12 bytes UTF-8.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      await changePassword(token, currentPassword, newPassword);
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 min-h-16 border-b border-gray-200 text-gray-600 text-xs">
        <div className="text-gray-500 text-xs">
          TrackFlow <span className="text-gray-300 px-2">/</span> Mi cuenta <span className="text-gray-300 px-2">/</span> Cambiar contraseña
        </div>
        <button type="button" className="profile-secondary-btn" onClick={logout}>Cerrar sesión</button>
      </div>

      {/* Page heading */}
      <div className="flex items-end justify-between gap-3 pt-8 pb-5">
        <div>
          <h1 className="text-2xl font-bold mt-0">Cambiar contraseña</h1>
          <p className="text-sm text-gray-500 mt-2">Actualiza la contraseña de tu cuenta.</p>
        </div>
        <Link href="/account/profile" className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md text-xs font-semibold text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 transition-colors">
          ← Volver al perfil
        </Link>
      </div>

      {/* Card */}
      <div className="profile-card border border-gray-200 rounded-lg bg-white shadow-sm mt-4 overflow-hidden">
        <form className="profile-fields grid gap-4 px-8 pb-8 pt-4" onSubmit={submit}>
          <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Contraseña actual
            <input
              name="current-password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Nueva contraseña
            <input
              name="new-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-gray-600">
            Confirmar nueva contraseña
            <input
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none"
            />
          </label>
          <div className="flex gap-3">
            <button className="profile-submit w-full h-11 inline-flex items-center justify-center gap-2 px-4 border rounded-lg text-sm font-bold" type="submit" disabled={busy}>
              {busy ? "Actualizando…" : "Actualizar contraseña"}
            </button>
            <Link href="/account/profile" className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100">
              Cancelar
            </Link>
          </div>
        </form>
        {success && <p className="text-xs text-green-600 px-4 pb-3">Contraseña actualizada correctamente. Vuelve a iniciar sesión con tu nueva contraseña.</p>}
        {error && <p className="text-xs text-red-600 px-4 pb-3" role="alert">{error}</p>}
      </div>
    </>
  );
}