import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getTrackFlowApiBase(): string {
  const configured = process.env.TRACKFLOW_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  // The Next.js and FastAPI dev servers run in the same Codespace/container.
  return 'http://127.0.0.1:8000';
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const endpoint = path.map(encodeURIComponent).join('/');
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  if (contentType) headers.set('Content-Type', contentType);
  if (authorization) headers.set('Authorization', authorization);

  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  try {
    const response = await fetch(`${getTrackFlowApiBase()}/${endpoint}${incoming.search}`, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    const responseType = response.headers.get('content-type');
    if (responseType) responseHeaders.set('Content-Type', responseType);
    const authenticate = response.headers.get('www-authenticate');
    if (authenticate) responseHeaders.set('WWW-Authenticate', authenticate);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ detail: 'No se pudo conectar con la API de TrackFlow.' }, { status: 502 });
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
