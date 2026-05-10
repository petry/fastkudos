export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  token?: string;
  body?: unknown;
}

export interface HttpClient {
  get<T>(path: string, opts?: { token?: string }): Promise<T>;
  post<T>(path: string, opts?: RequestOptions): Promise<T>;
  patch<T>(path: string, opts?: RequestOptions): Promise<T>;
  delete(path: string, opts?: { token?: string }): Promise<void>;
}

export function createHttpClient(baseUrl: string, fetchImpl: typeof fetch = fetch): HttpClient {
  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (opts.token) headers.authorization = `Bearer ${opts.token}`;
    if (opts.body !== undefined) headers['content-type'] = 'application/json';

    const init: RequestInit = { method, headers };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    const res = await fetchImpl(`${baseUrl}${path}`, init);
    if (!res.ok) {
      const code = await readErrorCode(res);
      throw new ApiError(res.status, code);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    get: (path, opts) => request('GET', path, opts),
    post: (path, opts) => request('POST', path, opts),
    patch: (path, opts) => request('PATCH', path, opts),
    delete: (path, opts) => request<void>('DELETE', path, opts),
  };
}

async function readErrorCode(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === 'string' && body.error.length > 0) return body.error;
  } catch {
    // body não é JSON parseável — fallback para http_<status>
  }
  return `http_${res.status}`;
}
