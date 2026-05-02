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

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
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
