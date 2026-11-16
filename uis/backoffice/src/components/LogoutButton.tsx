'use client';
import { useAuth } from '@/lib/auth';
export default function LogoutButton() { const { logout } = useAuth(); return <button onClick={logout} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">Cerrar sesión</button>; }