"use client";

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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo actualizar el perfil.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">TrackFlow <span>/</span> Mi cuenta <span>/</span> Perfil</div>
        <button type="button" className="secondary-button" onClick={logout}>Cerrar sesión</button>
      </header>
      <section className="page-heading">
        <div>
          <p className="eyebrow">MI CUENTA</p>
          <h1>Perfil</h1>
          <p className="page-description">Consulta y actualiza tus datos de contacto.</p>
        </div>
      </section>
      <section className="content-card profile-card">
        <div className="card-heading">
          <div>
            <h2>Datos de la cuenta</h2>
            <p>El correo se obtiene de tu usuario; los datos de contacto, de tu perfil.</p>
          </div>
        </div>
        {user && (
          <form className="auth-fields" key={formVersion} onSubmit={save}>
            <label>Correo electrónico<input value={user.email} readOnly /></label>
            <label>Nombre<input name="name" defaultValue={user.profile?.name || ""} maxLength={120} /></label>
            <label>Teléfono<input name="phone" type="tel" defaultValue={user.profile?.phone || ""} maxLength={40} /></label>
            <label>Dirección<input name="address" defaultValue={user.profile?.address || ""} maxLength={240} /></label>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        )}
        {message && <p className="analysis-message">{message}</p>}
        {error && <p className="analysis-message error" role="alert">{error}</p>}
      </section>
    </>
  );
}

