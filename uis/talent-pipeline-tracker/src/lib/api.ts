const configuredApiBaseUrl = process.env.NEXT_PUBLIC_TRACKFLOW_API_URL?.trim();

export const API_BASE_URL = (configuredApiBaseUrl || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')).replace(/\/$/, '');

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_TRACKFLOW_API_URL must be configured before using supplier or incident workflows.');
  }
  return API_BASE_URL;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function responseError(response: Response, fallback: string): Promise<ApiError> {
  let message = `${fallback} (HTTP ${response.status})`;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = body.detail;
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) message = detail.map((item) => item.msg).filter(Boolean).join(' ') || message;
    }
  } catch {
    // Keep the HTTP status when the server does not return JSON.
  }
  return new ApiError(message, response.status);
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await responseError(response, 'No se pudo iniciar sesión');
  return response.json() as Promise<LoginResponse>;
}

export async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(typeof FormData !== 'undefined' && init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  if (!response.ok) throw await responseError(response, 'La solicitud no se completó');
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiBlob(path: string, token: string): Promise<Blob> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw await responseError(response, 'No se pudo descargar el resultado');
  return response.blob();
}
