export function getApiBaseUrl(): string {
  // Keep browser requests same-origin. The Next.js route handler forwards to
  // FastAPI using server-side environment variables, avoiding Codespaces port
  // forwarding auth redirects and browser CORS restrictions.
  if (typeof window === 'undefined') {
    throw new Error('TrackFlow API requests must be made in the browser.');
  }
  return `${window.location.origin}/api/trackflow`;
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

async function responseError(response: Response, fallback: string): Promise<ApiError> {
  let message = `${fallback} (HTTP ${response.status})`;
  const fieldErrors: ApiFieldErrors = {};
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = body.detail;
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) {
        const messages: string[] = [];
        for (const item of detail) {
          if (!item || typeof item !== 'object' || !('msg' in item) || typeof item.msg !== 'string') continue;
          messages.push(item.msg);
          const location = 'loc' in item && Array.isArray(item.loc) ? item.loc : [];
          const field = [...location].reverse().find((part): part is keyof ApiFieldErrors =>
            typeof part === 'string' && registrationFields.has(part),
          );
          if (field) fieldErrors[field] = item.msg;
        }
        message = messages.join(' ') || message;
      }
    }
  } catch {
    // Keep the HTTP status when the server does not return JSON.
  }
  if (response.status === 409 && /email|correo|registrad/i.test(message)) {
    fieldErrors.email = message;
  }
  return new ApiError(message, response.status, fieldErrors);
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

export async function register(input: { email: string; password: string; name?: string; phone?: string; address?: string }): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await responseError(response, "No se pudo crear la cuenta");
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw await responseError(response, "No se pudo procesar la solicitud.");
  return response.json() as Promise<{ message: string }>;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) throw await responseError(response, "No se pudo restablecer la contraseña.");
  return response.json() as Promise<{ message: string }>;
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("trackflow:unauthorized"));
  if (!response.ok) throw await responseError(response, "No se pudo cambiar la contraseña.");
  return response.json() as Promise<{ message: string }>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await responseError(response, 'No se pudo iniciar sesiÃ³n');
  return response.json() as Promise<LoginResponse>;
}

export async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(typeof FormData !== 'undefined' && init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${getApiBaseUrl()}${path.replace(/^\/api\/trackflow/, '')}`, { ...init, headers });
  if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized'));
  if (!response.ok) throw await responseError(response, 'La solicitud no se completó');
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiBlob(path: string, token: string): Promise<Blob> {
  const response = await fetch(`${getApiBaseUrl()}${path.replace(/^\/api\/trackflow/, '')}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('trackflow:unauthorized'));
  if (!response.ok) throw await responseError(response, 'No se pudo descargar el resultado');
  return response.blob();
}
