import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
const TRACKER_API_BASE = (process.env.TRACKER_API_URL || 'https://playground.4geeks.com/tracker/api/v1').replace(/\/$/, '');
function getTrackFlowApiBase(): string {
  const configured = process.env.TRACKFLOW_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  return 'http://127.0.0.1:8000';
}
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const authorization = request.headers.get('authorization');
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return NextResponse.json({ detail: 'Se requiere una sesión válida.' }, { status: 401 });
  const trackflowApiBase = getTrackFlowApiBase();
  try {
    const session = await fetch(`${trackflowApiBase}/auth/me`, { headers: { Authorization: authorization }, cache: 'no-store' });
    if (session.status === 401 || session.status === 403) return NextResponse.json({ detail: 'La sesión ha caducado. Inicia sesión de nuevo.' }, { status: 401 });
    if (!session.ok) return NextResponse.json({ detail: 'No se pudo validar la sesión con la API de autenticación.' }, { status: 502 });
    const { path } = await context.params;
    const incoming = new URL(request.url);
    const upstream = `${TRACKER_API_BASE}/${path.map(encodeURIComponent).join('/')}${incoming.search}`;
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
    const response = await fetch(upstream, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual' });
    const responseHeaders = new Headers();
    const upstreamType = response.headers.get('content-type');
    if (upstreamType) responseHeaders.set('Content-Type', upstreamType);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ detail: 'No se pudo conectar con el servicio de candidaturas.' }, { status: 502 });
  }
}
export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;