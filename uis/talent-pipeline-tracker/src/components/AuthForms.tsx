'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '@/auth';

function LoginForm() {
  const { login, ready } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      await login(String(data.get('email')), String(data.get('password')));
      const next = search.get('next') || '/';
      router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center bg-gray-50 p-4"><section className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">TrackFlow · Talent Pipeline</p><h1 className="mt-2 text-2xl font-bold">Iniciar sesión</h1><p className="mt-2 text-gray-600">Accede a la gestión de candidaturas.</p><form className="mt-6 grid gap-4" onSubmit={submit}><label className="grid gap-1">Correo electrónico<input className="rounded border p-2" name="email" type="email" autoComplete="username" required /></label><label className="grid gap-1">Contraseña<input className="rounded border p-2" name="password" type="password" autoComplete="current-password" required /></label><button className="rounded bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!ready || busy}>{busy ? 'Verificando…' : 'Iniciar sesión'}</button></form>{error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}<p className="mt-4 text-sm">¿No tienes cuenta? <Link className="text-indigo-700 underline" href="/register">Regístrate</Link></p></section></main>;
}
export function LoginView() { return <Suspense fallback={<p className="p-8">Cargando…</p>}><LoginForm /></Suspense>; }

export function RegisterView() {
  const { register, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    const byteLength = new TextEncoder().encode(password).length;
    if (byteLength < 12 || byteLength > 72) { setError('La contraseña debe tener entre 12 y 72 bytes UTF-8.'); return; }
    setBusy(true); setError('');
    try {
      await register({ email: String(data.get('email')), password, name: String(data.get('name') || '') || undefined, phone: String(data.get('phone') || '') || undefined, address: String(data.get('address') || '') || undefined });
      router.replace('/');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center bg-gray-50 p-4"><section className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">TrackFlow · Talent Pipeline</p><h1 className="mt-2 text-2xl font-bold">Crear cuenta</h1><form className="mt-6 grid gap-4" onSubmit={submit}><label className="grid gap-1">Correo electrónico<input className="rounded border p-2" name="email" type="email" autoComplete="email" required /></label><label className="grid gap-1">Contraseña<input className="rounded border p-2" name="password" type="password" autoComplete="new-password" minLength={12} required /><span className="text-xs text-gray-600">Mínimo 12 y máximo 72 bytes UTF-8.</span></label><label className="grid gap-1">Nombre<input className="rounded border p-2" name="name" autoComplete="name" maxLength={120} /></label><label className="grid gap-1">Teléfono<input className="rounded border p-2" name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label className="grid gap-1">Dirección<input className="rounded border p-2" name="address" autoComplete="street-address" maxLength={240} /></label><button className="rounded bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!ready || busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button></form>{error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}<p className="mt-4 text-sm">¿Ya tienes cuenta? <Link className="text-indigo-700 underline" href="/login">Inicia sesión</Link></p></section></main>;
}
