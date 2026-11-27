interface ModelsBucketObject {
  key: string;
  size: number;
  uploaded: Date;
}
interface ModelsBucketBody extends ModelsBucketObject {
  body: ReadableStream;
  httpEtag: string;
}
interface ModelsBucket {
  list(options: { prefix: string; limit: number; cursor?: string }): Promise<{
    objects: ModelsBucketObject[];
    truncated: boolean;
    cursor?: string;
  }>;
  get(key: string): Promise<ModelsBucketBody | null>;
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface D1Result<T = Record<string, unknown>> { results?: T[]; success: boolean; }
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
interface D1Database { prepare(query: string): D1Statement; }
interface DiscoveryQueue { send(message: Record<string, unknown>): Promise<void>; }
interface DiscoveryQueueMessage { body: { jobId?: string; type?: string }; ack(): void; retry(): void; }
interface DiscoveryQueueBatch { messages: DiscoveryQueueMessage[]; }

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  DISCOVERY_QUEUE: DiscoveryQueue;
  /** Server-side Wheel Size API credential. Never expose this to browser code. */
  WHEEL_SIZE_API_KEY?: string;
  MODELS_BUCKET: ModelsBucket;
}

const API_BASE = 'https://api.wheel-size.com/v2';
const CATALOG_ENDPOINTS = new Set([
  'regions',
  'makes',
  'models',
  'years',
  'generations',
  'modifications',
]);
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
  const region = url.searchParams.get('region');
  if (region && route !== 'regions') upstream.searchParams.set('region', region);
  upstream.searchParams.set('user_key', env.WHEEL_SIZE_API_KEY);

  try {
    const response = await fetch(upstream.toString(), {
      headers: { accept: 'application/json', 'accept-encoding': 'gzip' },
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

async function modelRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  if (url.pathname === '/api/models') {
    const objects: ModelsBucketObject[] = [];
    let cursor: string | undefined;
    do {
      const listed = await env.MODELS_BUCKET.list({
        prefix: 'models/',
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      });
      objects.push(...listed.objects);
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
    const models = objects
      .filter((object) => object.key.toLowerCase().endsWith('.glb') && object.size > 0)
      .map((object) => ({
        key: object.key,
        name: object.key
          .slice(7)
          .replace(/\.glb$/i, '')
          .replace(/[_-]+/g, ' '),
        size: object.size,
        uploaded: object.uploaded.toISOString(),
        url: '/api/models/file?key=' + encodeURIComponent(object.key),
      }));
    return json({ models, truncated: false }, 200, {
      'cache-control': 'public, max-age=60, s-maxage=300',
    });
  }
  if (url.pathname === '/api/models/file') {
    const key = url.searchParams.get('key') || '';
    if (
      !key.startsWith('models/') ||
      !key.toLowerCase().endsWith('.glb') ||
      key.includes('..') ||
      key.includes('\\\\')
    )
      return json({ error: 'INVALID_MODEL_KEY' }, 400);
    const object = await env.MODELS_BUCKET.get(key);
    if (!object) return json({ error: 'MODEL_NOT_FOUND' }, 404);
    return new Response(object.body, {
      headers: {
        'content-type': 'model/gltf-binary',
        'content-length': String(object.size),
        'cache-control': 'public, max-age=3600',
        etag: object.httpEtag,
      },
    });
  }
  return json({ error: 'NOT_FOUND' }, 404);
}


const MAX_DISCOVERY_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg')
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png')
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
      bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d &&
      bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (mime === 'image/webp')
    return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

async function createImageDiscovery(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data'))
    return json({ error: 'MULTIPART_REQUIRED' }, 415);

  let form: FormData;
  try { form = await request.formData(); }
  catch { return json({ error: 'INVALID_MULTIPART' }, 400); }

  const file = form.get('image');
  if (!(file instanceof File)) return json({ error: 'IMAGE_REQUIRED' }, 400);
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return json({ error: 'UNSUPPORTED_IMAGE_TYPE' }, 415);
  if (file.size < 1 || file.size > MAX_DISCOVERY_IMAGE_BYTES)
    return json({ error: 'IMAGE_SIZE_LIMIT' }, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageSignature(bytes, file.type)) return json({ error: 'IMAGE_SIGNATURE_MISMATCH' }, 415);

  const id = crypto.randomUUID();
  const objectKey = 'discovery/references/' + id;
  let objectStored = false;
  let jobCreated = false;
  try {
    await env.MODELS_BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: file.type } });
    objectStored = true;
    await env.DB.prepare(
      'INSERT INTO discovery_jobs (id, input_type, status, reference_object_key, reference_mime_type, reference_size_bytes) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, 'image', 'queued', objectKey, file.type, file.size).run();
    jobCreated = true;
    await env.DB.prepare(
      'INSERT INTO discovery_references (id, job_id, source_type) VALUES (?, ?, ?)'
    ).bind(crypto.randomUUID(), id, 'image').run();
    await env.DISCOVERY_QUEUE.send({ jobId: id, type: 'image_discovery' });
    return json({ jobId: id, status: 'queued' }, 202);
  } catch {
    if (jobCreated) {
      // Keep the reference and mark the job terminal if the queue could not accept it.
      await env.DB.prepare(
        "UPDATE discovery_jobs SET status = 'failed', error_code = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'queued'"
      ).bind(
        'DISCOVERY_INTAKE_FAILED',
        'The reference was stored, but the processing queue could not accept the job. Please retry.',
        id,
      ).run().catch(() => undefined);
    } else if (objectStored) {
      // No durable D1 job exists, so remove the otherwise orphaned object.
      await env.MODELS_BUCKET.delete(objectKey).catch(() => undefined);
    }
    return json({ error: 'DISCOVERY_INTAKE_FAILED' }, 500);
  }
}

async function getDiscoveryJob(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const id = new URL(request.url).pathname.split('/').filter(Boolean).at(-1) || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'INVALID_JOB_ID' }, 400);
  const job = await env.DB.prepare(
    'SELECT id, input_type, status, error_code, error_message, created_at, updated_at, completed_at FROM discovery_jobs WHERE id = ?'
  ).bind(id).first();
  if (!job) return json({ error: 'DISCOVERY_JOB_NOT_FOUND' }, 404);
  const matches = await env.DB.prepare(
    'SELECT m.id, m.match_type, m.similarity_score, m.explanation, p.id AS product_id, p.slug, p.product_name FROM discovery_matches m JOIN products p ON p.id = m.product_id WHERE m.job_id = ? ORDER BY CASE m.match_type WHEN \'exact\' THEN 0 WHEN \'visual_similar\' THEN 1 ELSE 2 END, m.similarity_score DESC'
  ).bind(id).run();
  return json({ job, matches: matches.results || [] });
}

const handler = {
  async queue(batch: DiscoveryQueueBatch, env: Env) {
    for (const message of batch.messages) {
      const jobId = message.body?.jobId;
      if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
        message.ack();
        continue;
      }
      try {
        const job = await env.DB.prepare(
          "SELECT id, status FROM discovery_jobs WHERE id = ?"
        ).bind(jobId).first<{ id: string; status: string }>();
        if (!job || job.status === 'completed' || job.status === 'failed') {
          message.ack();
          continue;
        }
        await env.DB.prepare(
          "UPDATE discovery_jobs SET status = 'failed', error_code = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('queued', 'processing')"
        ).bind(
          'MATCHING_NOT_CONFIGURED',
          'Your reference was received, but visual matching is not available yet because the OURANOS product catalogue and image index are not ready.',
          jobId,
        ).run();
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/discover/image') return createImageDiscovery(request, env);
    if (url.pathname.startsWith('/api/discover/jobs/')) return getDiscoveryJob(request, env);
    if (url.pathname.startsWith('/api/wheel-size/')) return wheelSizeRequest(request, env);
    if (url.pathname.startsWith('/api/models')) return modelRequest(request, env);
    return env.ASSETS.fetch(request);
  },
};

export default handler;
