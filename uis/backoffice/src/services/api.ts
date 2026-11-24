import type { Candidate, Note, CreateCandidatePayload, UpdateCandidatePayload, PatchCandidatePayload, CreateNotePayload } from '@/types';
import { getStoredToken } from '@/lib/api';

const RECORDS_ENDPOINT = '/api/tracker/records';
const RECORDS_LIST_ENDPOINT = `${RECORDS_ENDPOINT}?page=1&limit=1000`;
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized'));
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'No se pudo procesar la solicitud. Revisa los datos e inténtalo de nuevo.',
      401: 'La sesión ha caducado. Inicia sesión de nuevo.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'No se encontró la candidatura solicitada.',
      409: 'La información entra en conflicto con un registro existente.',
      422: 'Revisa los datos ingresados e inténtalo de nuevo.',
    };
    throw new Error(messages[response.status] || 'No se pudo completar la solicitud. Inténtalo de nuevo.');
  }
  if (response.status === 204) return undefined as unknown as T;
  try {
    return await response.json() as T;
  } catch {
    throw new Error('El servicio respondió de forma inesperada. Inténtalo de nuevo.');
  }
}
async function trackerFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token: string | null;
  try {
    token = getStoredToken();
  } catch {
    throw new Error('No se pudo acceder a la sesión guardada. Revisa la configuración del navegador e inténtalo de nuevo.');
  }
  if (!token) { if (typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized')); throw new Error('La sesión ha caducado. Inicia sesión de nuevo.'); }
  const headers = new Headers(init.headers); headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    return await fetch(path, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new Error('No se pudo conectar con el servicio de candidaturas. Comprueba tu conexión e inténtalo de nuevo.');
  }
}
function normalizeRecords(payload: unknown): Candidate[] {
  if (Array.isArray(payload)) return payload as Candidate[];
  if (payload && typeof payload === 'object') { const data = payload as { records?: unknown; data?: unknown; items?: unknown }; if (Array.isArray(data.records)) return data.records as Candidate[]; if (Array.isArray(data.data)) return data.data as Candidate[]; if (Array.isArray(data.items)) return data.items as Candidate[]; }
  throw new Error('El servicio devolvió un formato inesperado para las candidaturas. Inténtalo de nuevo o contacta con soporte.');
}
function normalizeNotes(payload: unknown): Note[] {
  if (Array.isArray(payload)) return payload as Note[];
  if (payload && typeof payload === 'object') { const data = payload as { notes?: unknown; data?: unknown; items?: unknown }; if (Array.isArray(data.notes)) return data.notes as Note[]; if (Array.isArray(data.data)) return data.data as Note[]; if (Array.isArray(data.items)) return data.items as Note[]; }
  throw new Error('El servicio devolvió un formato inesperado para las notas. Inténtalo de nuevo o contacta con soporte.');
}
export async function fetchCandidates(): Promise<Candidate[]> { return normalizeRecords(await handleResponse<unknown>(await trackerFetch(RECORDS_LIST_ENDPOINT))); }
export async function fetchCandidate(id: string): Promise<Candidate> { return handleResponse<Candidate>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`)); }
export async function createCandidate(payload: CreateCandidatePayload): Promise<Candidate> { return handleResponse<Candidate>(await trackerFetch(RECORDS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })); }
export async function updateCandidate(id: string, payload: UpdateCandidatePayload): Promise<Candidate> { return handleResponse<Candidate>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })); }
export async function patchCandidate(id: string, payload: PatchCandidatePayload): Promise<Candidate> { return handleResponse<Candidate>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })); }
export async function deleteCandidate(id: string): Promise<void> { await handleResponse<void>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' })); }
export async function fetchNotes(id: string): Promise<Note[]> { return normalizeNotes(await handleResponse<unknown>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}/notes`))); }
export async function createNote(id: string, payload: CreateNotePayload): Promise<Note> { return handleResponse<Note>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })); }
export async function deleteNote(id: string, noteId: string): Promise<void> { await handleResponse<void>(await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' })); }