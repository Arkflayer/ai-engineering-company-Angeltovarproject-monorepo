const configuredApiBaseUrl = process.env.NEXT_PUBLIC_TRACKFLOW_API_URL?.trim();

export const API_BASE_URL = (configuredApiBaseUrl || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')).replace(/\/$/, '');

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiError('El servicio no está configurado en este momento. Contacta con soporte si el problema continúa.', 0);
  }
  return API_BASE_URL;
}

export type ApiFieldErrors = Partial<Record<'email' | 'password' | 'name' | 'phone' | 'address', string>>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: ApiFieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const registrationFields = new Set(['email', 'password', 'name', 'phone', 'address']);

const statusMessages: Record<number, string> = {
  400: 'No se pudo procesar la solicitud. Revisa los datos e inténtalo de nuevo.',
  401: 'La sesión no es válida o ha caducado. Inicia sesión de nuevo.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No se encontró la información solicitada.',
  409: 'La información entra en conflicto con un registro existente.',
  413: 'El archivo supera el tamaño permitido.',
  415: 'El formato enviado no es compatible.',
  422: 'Revisa los datos ingresados e inténtalo de nuevo.',
  502: 'El servicio no está disponible en este momento. Inténtalo de nuevo.',
};

function validationMessage(field: keyof ApiFieldErrors): string {
  const messages: Record<keyof ApiFieldErrors, string> = {
    email: 'Introduce un correo electrónico válido.',
    password: 'Revisa la contraseña e inténtalo de nuevo.',
    name: 'Revisa el nombre ingresado.',
    phone: 'Revisa el teléfono ingresado.',
    address: 'Revisa la dirección ingresada.',
  };
  return messages[field];
}

async function responseError(response: Response, fallback: string): Promise<ApiError> {
  const fieldErrors: ApiFieldErrors = {};
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body && Array.isArray(body.detail)) {
      for (const item of body.detail) {
        if (!item || typeof item !== 'object' || !('loc' in item) || !Array.isArray(item.loc)) continue;
        const field = [...item.loc].reverse().find((part): part is keyof ApiFieldErrors =>
          typeof part === 'string' && registrationFields.has(part),
        );
        if (field) fieldErrors[field] = validationMessage(field);
      }
    }
  } catch {
    // La respuesta de error puede no incluir JSON; no mostramos su contenido técnico.
  }
  const message = Object.keys(fieldErrors).length
    ? 'Revisa los campos señalados.'
    : statusMessages[response.status] || fallback;
  return new ApiError(message, response.status, fieldErrors);
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ApiError('No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.', 0);
  }
}

async function responseJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    throw new ApiError('El servicio respondió de forma inesperada. Inténtalo de nuevo.', response.status);
  }
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

const TOKEN_KEY = "trackflow-access-token";

export function setStoredToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export async function register(input: { email: string; password: string; name?: string; phone?: string; address?: string }): Promise<void> {
  const response = await safeFetch(`${getApiBaseUrl()}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await responseError(response, "No se pudo crear la cuenta");
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await safeFetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await responseError(response, 'No se pudo iniciar sesiÃ³n');
  return responseJson<LoginResponse>(response);
}

export async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(typeof FormData !== 'undefined' && init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await safeFetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized'));
  if (!response.ok) throw await responseError(response, 'La solicitud no se completó');
  if (response.status === 204) return undefined as T;
  return responseJson<T>(response);
}

export async function apiBlob(path: string, token: string): Promise<Blob> {
  const response = await safeFetch(`${getApiBaseUrl()}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized'));
  if (!response.ok) throw await responseError(response, 'No se pudo descargar el resultado');
  return response.blob();
}
