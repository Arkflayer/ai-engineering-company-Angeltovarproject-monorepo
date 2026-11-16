// src/services/api.ts
// Servicio de llamadas a la API REST con fetch + async/await

import type { Candidate, Note, CreateCandidatePayload, UpdateCandidatePayload, PatchCandidatePayload, CreateNotePayload } from '@/types';

const RECORDS_ENDPOINT = '/api/tracker/records';
const RECORDS_LIST_ENDPOINT = `${RECORDS_ENDPOINT}?page=1&limit=1000`;
const TOKEN_KEY = 'trackflow-access-token';

// Utilidad para manejar errores de fetch
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('trackflow:unauthorized'));
  }
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  // Para DELETE o respuestas sin contenido
  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

async function trackerFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  if (!token) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized'));
    throw new Error('La sesión ha caducado. Inicia sesión de nuevo.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(path, { ...init, headers, cache: 'no-store' });
}

// GET /records puede devolver directamente un array o un objeto envolvente,
// según la versión del backend. Normalizamos ambos formatos para la UI.
function normalizeRecords(payload: unknown): Candidate[] {
  if (Array.isArray(payload)) return payload as Candidate[];

  if (payload && typeof payload === 'object') {
    const data = payload as { records?: unknown; data?: unknown; items?: unknown };
    if (Array.isArray(data.records)) return data.records as Candidate[];
    if (Array.isArray(data.data)) return data.data as Candidate[];
    if (Array.isArray(data.items)) return data.items as Candidate[];
  }

  throw new Error('La API devolvió un formato inesperado para las candidaturas');
}

function normalizeNotes(payload: unknown): Note[] {
  if (Array.isArray(payload)) return payload as Note[];

  if (payload && typeof payload === 'object') {
    const data = payload as { notes?: unknown; data?: unknown; items?: unknown };
    if (Array.isArray(data.notes)) return data.notes as Note[];
    if (Array.isArray(data.data)) return data.data as Note[];
    if (Array.isArray(data.items)) return data.items as Note[];
  }

  throw new Error('La API devolvió un formato inesperado para las notas');
}

// ─── Candidates ──────────────────────────────────────────────

/** GET /records — Obtiene la lista de todos los candidatos */
export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await trackerFetch(RECORDS_LIST_ENDPOINT);
  const payload = await handleResponse<unknown>(res);
  return normalizeRecords(payload);
}

/** GET /records/:id — Obtiene un candidato por ID */
export async function fetchCandidate(id: string): Promise<Candidate> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`);
  return handleResponse<Candidate>(res);
}

/** POST /records — Crea una nueva candidatura */
export async function createCandidate(payload: CreateCandidatePayload): Promise<Candidate> {
  const res = await trackerFetch(RECORDS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Candidate>(res);
}

/** PUT /records/:id — Reemplaza/edita por completo una candidatura */
export async function updateCandidate(id: string, payload: UpdateCandidatePayload): Promise<Candidate> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Candidate>(res);
}

/** PATCH /records/:id — Actualiza parcialmente una candidatura (estado o etapa) */
export async function patchCandidate(id: string, payload: PatchCandidatePayload): Promise<Candidate> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Candidate>(res);
}

/** DELETE /records/:id — Elimina una candidatura */
export async function deleteCandidate(id: string): Promise<void> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await handleResponse<void>(res);
}

// ─── Notes ───────────────────────────────────────────────────

/** GET /records/:id/notes — Obtiene las notas de una candidatura */
export async function fetchNotes(candidateId: string): Promise<Note[]> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(candidateId)}/notes`);
  const payload = await handleResponse<unknown>(res);
  return normalizeNotes(payload);
}

/** POST /records/:id/notes — Añade una nota a una candidatura */
export async function createNote(candidateId: string, payload: CreateNotePayload): Promise<Note> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(candidateId)}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Note>(res);
}

/** DELETE /records/:id/notes/:noteId — Elimina una nota */
export async function deleteNote(candidateId: string, noteId: string): Promise<void> {
  const res = await trackerFetch(`${RECORDS_ENDPOINT}/${encodeURIComponent(candidateId)}/notes/${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(res);
}