export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Server-side secret. Never expose this through a VITE_ prefixed variable. */
  WHEEL_SIZE_API_KEY?: string;
}

interface WorkerHandler {
  fetch(request: Request, env: Env): Promise<Response>;
}

const handler: WorkerHandler = {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};

export default handler;
