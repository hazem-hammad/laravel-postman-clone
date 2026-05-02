import { request } from './client';
import type { KeyValue, RunResult } from './types';

export type RunInput = {
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body_mode: string | null;
  body: unknown;
  environment_id: string | null;
  collection_id: string | null;
  request_id: string | null;
  request_name: string | null;
};

export const sendRun = (input: RunInput) =>
  request<{ run_id: number; result: RunResult }>('/runs', { method: 'POST', body: input });
