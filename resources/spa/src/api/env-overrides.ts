import { request } from './client';

export const setEnvOverride = (envId: string, name: string, value: string) =>
  request<{ variable: { name: string; value: string; is_secret: boolean; source: string } }>(
    `/environments/${encodeURIComponent(envId)}/variables/${encodeURIComponent(name)}`,
    { method: 'PUT', body: { value } }
  );

export const clearEnvOverride = (envId: string, name: string) =>
  request<{ ok: true }>(
    `/environments/${encodeURIComponent(envId)}/variables/${encodeURIComponent(name)}`,
    { method: 'DELETE' }
  );
