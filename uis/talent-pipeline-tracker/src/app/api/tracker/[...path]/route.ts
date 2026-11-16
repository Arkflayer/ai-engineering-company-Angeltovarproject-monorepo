import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TRACKER_API_BASE = (process.env.TRACKER_API_URL || 'https://playground.4geeks.com/tracker/api/v1').replace(/\/$/, '');
const TRACKFLOW_API_BASE = (process.env.TRACKFLOW_API_URL || process.env.NEXT_PUBLIC_TRACKFLOW_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = request.headers.get('authorization');
  if (!token || !/^Bearer\s+\S+$/i.test(token)) {
    return NextResponse.json({ detail: 'Se requiere una sesión válida.' }, { status: 401 });
  }

  try {
    const sessionResponse = await fetch(`${TRACKFLOW_API_BASE}/auth/me`, {
      headers: { Authorization: token },
      cache: 'no-store',
    });
    if (sessionResponse.status === 401 || sessionResponse.status === 403) {
      return NextResponse.json({ detail: 'La sesión ha caducado. Inicia sesión de nuevo.' }, { status: 401 });
    }
    if (!sessionResponse.ok) {
      return NextResponse.json({ detail: 'No se pudo validar la sesión con la API de autenticación.' }, { status: 502 });
    }

    const { path } = await context.params;
    const incomingUrl = new URL(request.url);
    const upstreamUrl = `${TRACKER_API_BASE}/${path.map(encodeURIComponent).join('/')}${incomingUrl.search}`;
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get('content-type');
    if (upstreamContentType) responseHeaders.set('Content-Type', upstreamContentType);
    return new NextResponse(upstreamResponse.body, { status: upstreamResponse.status, headers: responseHeaders });
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
