import { getApiBase } from '@/lib/runtime';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly payload: unknown) {
    super(`API error ${status}`);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
};

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const eq = c.indexOf('=');
    if (eq === -1) continue;
    if (decodeURIComponent(c.slice(0, eq)) === name) {
      return decodeURIComponent(c.slice(eq + 1));
    }
  }
  return null;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const method = options.method ?? 'GET';
  const xsrf = MUTATING.has(method) ? readCookie('XSRF-TOKEN') : null;
  const init: RequestInit = {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      ...(options.headers ?? {}),
    },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, json);
  }
  return json as T;
}
