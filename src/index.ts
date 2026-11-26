export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Server-side Wheel Size API credential. Never expose this to browser code. */
  WHEEL_SIZE_API_KEY?: string;
}

const API_BASE = 'https://api.wheel-size.com/v2';
const CATALOG_ENDPOINTS = new Set(['makes', 'models', 'years', 'generations', 'modifications']);
const ALLOWED_PARAMS = new Set([
  'region',
  'make',
  'model',
  'year',
  'generation',
  'modification',
  'offset',
  'limit',
  'lang',
]);

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

function corsHeaders(origin: string | null) {
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'Origin',
  };
}

async function wheelSizeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/wheel-size\/?/, '').replace(/\/$/, '');
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, 405, cors);
  if (!env.WHEEL_SIZE_API_KEY)
    return json(
      {
        error: 'WHEEL_SIZE_NOT_CONFIGURED',
        message: 'Wheel Size API credentials are not configured on this Worker.',
      },
      503,
      cors,
    );

  const allowed = CATALOG_ENDPOINTS.has(route) || route === 'search/by_model';
  if (!allowed) return json({ error: 'ENDPOINT_NOT_ALLOWED' }, 404, cors);

  const upstream = new URL(`${API_BASE}/${route}/`);
  for (const [key, value] of url.searchParams) {
    if (ALLOWED_PARAMS.has(key) && value.trim()) upstream.searchParams.set(key, value.trim());
  }
  upstream.searchParams.set('region', url.searchParams.get('region') || 'usdm');
  upstream.searchParams.set('user_key', env.WHEEL_SIZE_API_KEY);

  try {
    const response = await fetch(upstream.toString(), {
      headers: { accept: 'application/json', 'accept-encoding': 'gzip' },
      cf: CATALOG_ENDPOINTS.has(route)
        ? { cacheTtl: 3600, cacheEverything: true }
        : { cacheTtl: 0 },
    });
    const body = await response.text();
    const headers = new Headers(cors);
    headers.set(
      'content-type',
      response.headers.get('content-type') || 'application/json; charset=utf-8',
    );
    headers.set('cache-control', CATALOG_ENDPOINTS.has(route) ? 'public, max-age=900' : 'no-store');
    if (!response.ok) {
      return json(
        { error: 'WHEEL_SIZE_UPSTREAM_ERROR', status: response.status, details: safeError(body) },
        response.status >= 500 ? 502 : response.status,
        cors,
      );
    }
    return new Response(body, { status: 200, headers });
  } catch (error) {
    return json(
      {
        error: 'WHEEL_SIZE_REQUEST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown upstream error',
      },
      502,
      cors,
    );
  }
}

function safeError(body: string) {
  try {
    const parsed = JSON.parse(body);
    return { code: parsed.code, detail: parsed.detail, message: parsed.message };
  } catch {
    return body.slice(0, 500);
  }
}

const handler = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/wheel-size/')) return wheelSizeRequest(request, env);
    return env.ASSETS.fetch(request);
  },
};

export default handler;
