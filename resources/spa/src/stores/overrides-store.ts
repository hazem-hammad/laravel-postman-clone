import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KeyValue } from '@/api/types';

export type RequestOverride = {
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  bodyMode: string | null;
  body: unknown;
  savedAt: number;
};

type OverrideKey = string; // `${collectionId}::${requestId}`

type State = {
  overrides: Record<OverrideKey, RequestOverride>;
  saveOverride: (collectionId: string, requestId: string, data: Omit<RequestOverride, 'savedAt'>) => void;
  clearOverride: (collectionId: string, requestId: string) => void;
  hasOverride: (collectionId: string, requestId: string) => boolean;
  getOverride: (collectionId: string, requestId: string) => RequestOverride | null;
};

const keyOf = (collectionId: string, requestId: string) => `${collectionId}::${requestId}`;

export const useOverridesStore = create<State>()(
  persist(
    (set, get) => ({
      overrides: {},

      saveOverride(collectionId, requestId, data) {
        const k = keyOf(collectionId, requestId);
        set({
          overrides: {
            ...get().overrides,
            [k]: { ...data, savedAt: Date.now() },
          },
        });
      },

      clearOverride(collectionId, requestId) {
        const k = keyOf(collectionId, requestId);
        const next = { ...get().overrides };
        delete next[k];
        set({ overrides: next });
      },

      hasOverride(collectionId, requestId) {
        return !!get().overrides[keyOf(collectionId, requestId)];
      },

      getOverride(collectionId, requestId) {
        return get().overrides[keyOf(collectionId, requestId)] ?? null;
      },
    }),
    { name: 'postman-clone-overrides' }
  )
);

/**
 * Merge any saved override for the given (collection, request) pair on top
 * of a default tab input. Returns the input unchanged when there's no
 * override or no (collection, request) identity.
 */
export function applyOverride<
  T extends {
    collectionId: string | null;
    requestId: string | null;
    method: string;
    url: string;
    headers: KeyValue[];
    params: KeyValue[];
    bodyMode: string | null;
    body: unknown;
  }
>(input: T): T {
  if (!input.collectionId || !input.requestId) return input;
  const o = useOverridesStore.getState().getOverride(input.collectionId, input.requestId);
  if (!o) return input;
  return {
    ...input,
    method: o.method,
    url: o.url,
    headers: o.headers,
    params: o.params,
    bodyMode: o.bodyMode,
    body: o.body,
  };
}
