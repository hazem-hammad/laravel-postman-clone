import { request } from './client';
import type { CollectionDetail, CollectionEntry } from './types';

export const listCollections = () =>
  request<{ data: CollectionEntry[] }>('/collections').then((r) => r.data);

export const showCollection = (id: string) =>
  request<CollectionDetail>(`/collections/${encodeURIComponent(id)}`);
