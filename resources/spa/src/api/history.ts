import { request } from './client';
import type { Paginated, RunRecordFull, RunRecordSummary } from './types';

export const listHistory = (perPage = 50) =>
  request<Paginated<RunRecordSummary>>(`/history?per_page=${perPage}`);

export const showRun = (id: number) => request<RunRecordFull>(`/runs/${id}`);
export const deleteRun = (id: number) => request<{ ok: true }>(`/runs/${id}`, { method: 'DELETE' });
