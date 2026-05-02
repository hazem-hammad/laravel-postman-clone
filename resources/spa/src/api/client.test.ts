import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request, ApiError } from './client';

describe('api client', () => {
  beforeEach(() => {
    (window as any).__POSTMAN_CLONE__ = { theme: {}, route_prefix: 'postman' };
  });

  it('prefixes the route prefix and parses JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await request<{ hello: string }>('/bootstrap');

    expect(fetchMock).toHaveBeenCalledWith('/postman/api/bootstrap', expect.any(Object));
    expect(result).toEqual({ hello: 'world' });
  });

  it('throws ApiError with status on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ message: 'Gone' }),
    }));

    await expect(request('/collections/missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('JSON-stringifies object bodies and sets Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/runs', { method: 'POST', body: { url: 'x' } });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe('POST');
    expect((call[1].headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(call[1].body).toBe(JSON.stringify({ url: 'x' }));
  });
});
