"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Profile = { name: string | null; phone: string | null; address: string | null };
type CurrentUser = { email: string; profile: Profile | null };

export default function ProfilePage() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<CurrentUser>("/auth/me", token)
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "No se pudo cargar el perfil.");
      });
    return () => { active = false; };
  }, [token]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const name = String(data.get("name") || "").trim();
      const changes: { name?: string; phone: string | null; address: string | null } = {
        phone: String(data.get("phone") || "").trim() || null,
        address: String(data.get("address") || "").trim() || null,
      };
      changes.name = name;
      const profile = await apiRequest<Profile>("/profiles/me", token, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setUser((current) => current ? { ...current, profile } : current);
      setFormVersion((version) => version + 1);
      setMessage("Perfil actualizado correctamente.");
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo actualizar el perfil.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 min-h-16 border-b border-gray-200 text-gray-600 text-xs">
        <div className="text-gray-500 text-xs">
          TrackFlow <span className="text-gray-300 px-2">/</span> Mi cuenta <span className="text-gray-300 px-2">/</span> Perfil
        </div>
        <button type="button" className="profile-secondary-btn" onClick={logout}>Cerrar sesión</button>
      </div>

      {/* Page heading */}
      <div className="flex items-end justify-between gap-3 pt-8 pb-5">
        <div>
          <h1 className="text-2xl font-bold mt-0">Perfil</h1>
          <p className="text-sm text-gray-500 mt-2">Tus datos de contacto.</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md text-xs font-semibold text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 transition-colors">
          ← Volver al panel
        </Link>
      </div>

      {/* Profile card */}
      <div className="profile-card border border-gray-200 rounded-lg bg-white shadow-sm mt-4 overflow-hidden">
        {user && !editing && (
                  <div className="profile-fields grid gap-4 px-8 pb-8 pt-4">
                    {/* Vista: datos como texto sin borde de input */}
            <div className="grid gap-1 text-xs font-semibold text-gray-600">
              Correo electrónico
                      <p className="text-gray-800 text-sm py-1">{user.email}</p>
            </div>
            <div className="grid gap-1 text-xs font-semibold text-gray-600">
              Nombre
                      <p className="text-gray-800 text-sm py-1">{user.profile?.name || "—"}</p>
            </div>
            <div className="grid gap-1 text-xs font-semibold text-gray-600">
              Teléfono
                      <p className="text-gray-800 text-sm py-1">{user.profile?.phone || "—"}</p>
            </div>
            <div className="grid gap-1 text-xs font-semibold text-gray-600">
              Dirección
                      <p className="text-gray-800 text-sm py-1">{user.profile?.address || "—"}</p>
            </div>
                        <div className="mt-2">
                          <Link href="/account/change-password" className="text-xs font-semibold text-gray-500 underline hover:text-blue-600">
                            Cambiar contraseña
                          </Link>
                        </div>
            <button type="button" className="profile-submit w-full h-11 inline-flex items-center justify-center gap-2 px-4 border rounded-lg text-sm font-bold" onClick={() => { setEditing(true); setMessage(""); setError(""); }}>
              Actualizar datos
            </button>
          </div>
        )}
        {user && editing && (
                  <form className="profile-fields grid gap-4 px-8 pb-8 pt-4" key={formVersion} onSubmit={save}>
            {/* Edición: inputs editables */}
            <label className="grid gap-1 text-xs font-semibold text-gray-600">
              Correo electrónico
              <input value={user.email} readOnly className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm outline-none cursor-default" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-gray-600">
              Nombre
              <input name="name" defaultValue={user.profile?.name || ""} maxLength={120} className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-gray-600">
              Teléfono
              <input name="phone" type="tel" defaultValue={user.profile?.phone || ""} maxLength={40} className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-gray-600">
              Dirección
              <input name="address" defaultValue={user.profile?.address || ""} maxLength={240} className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm outline-none" />
            </label>
            <div className="flex gap-3">
              <button className="profile-submit w-full h-11 inline-flex items-center justify-center gap-2 px-4 border rounded-lg text-sm font-bold" type="submit" disabled={busy}>
                {busy ? "Guardando…" : "Guardar cambios"}
              </button>
              <button type="button" className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}
        {message && <p className="text-xs text-green-600 px-4 pb-3">{message}</p>}
        {error && <p className="text-xs text-red-600 px-4 pb-3" role="alert">{error}</p>}
      </div>
    </>
  );
}

