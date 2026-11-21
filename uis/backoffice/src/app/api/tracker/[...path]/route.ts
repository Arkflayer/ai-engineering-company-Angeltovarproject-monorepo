import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
const TRACKER_API_BASE = (process.env.TRACKER_API_URL || 'https://playground.4geeks.com/tracker/api/v1').replace(/\/$/, '');
const TRACKFLOW_API_BASE = (process.env.TRACKFLOW_API_URL || process.env.NEXT_PUBLIC_TRACKFLOW_API_URL || 'http://localhost:8000').replace(/\/$/, '');
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const authorization = request.headers.get('authorization');
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return NextResponse.json({ detail: 'Se requiere una sesión válida.' }, { status: 401 });
  let session: Response;
  try {
    session = await fetch(`${TRACKFLOW_API_BASE}/auth/me`, { headers: { Authorization: authorization }, cache: 'no-store' });
  } catch {
    return NextResponse.json({ detail: 'No se pudo validar la sesión en este momento. Inténtalo de nuevo.' }, { status: 502 });
  }
  if (session.status === 401 || session.status === 403) return NextResponse.json({ detail: 'La sesión ha caducado. Inicia sesión de nuevo.' }, { status: 401 });
  if (!session.ok) return NextResponse.json({ detail: 'No se pudo validar la sesión con la API de autenticación.' }, { status: 502 });

  let routePath: string[];
  try {
    ({ path: routePath } = await context.params);
  } catch {
    return NextResponse.json({ detail: 'No se pudo procesar la solicitud. Inténtalo de nuevo.' }, { status: 400 });
  }
  const incoming = new URL(request.url);
  const upstream = `${TRACKER_API_BASE}/${routePath.map(encodeURIComponent).join('/')}${incoming.search}`;
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  let body: ArrayBuffer | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.arrayBuffer();
    } catch {
      return NextResponse.json({ detail: 'No se pudo leer el contenido enviado. Inténtalo de nuevo.' }, { status: 400 });
    }
  }
  let response: Response;
  try {
    response = await fetch(upstream, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual' });
  } catch {
    return NextResponse.json({ detail: 'No se pudo conectar con el servicio de candidaturas.' }, { status: 502 });
  }
  const responseHeaders = new Headers();
  const upstreamType = response.headers.get('content-type');
  if (upstreamType) responseHeaders.set('Content-Type', upstreamType);
  return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
}
export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;