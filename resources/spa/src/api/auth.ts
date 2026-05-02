import { request } from './client';
import { getRuntime } from '@/lib/runtime';

export const signInUrl = (): string =>
  `/${getRuntime().route_prefix}/auth/github/start`;

export const signOut = () => request<void>('/auth/sign-out', { method: 'POST' });
