import { request } from './client';
import type { EnvironmentDetail } from './types';

export const listEnvironments = () =>
  request<{ data: EnvironmentDetail[] }>('/environments').then((r) => r.data);
