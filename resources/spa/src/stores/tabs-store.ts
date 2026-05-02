import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeyValue, RunResult } from '@/api/types';
import type { RequestSubTab } from '@/stores/ui-store';

export type Tab = {
  id: string;
  collectionId: string | null;
  requestId: string | null;
  name: string;
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  bodyMode: string | null;
  body: unknown;
  // Per-tab sub-tab state (Postman matches this — each tab remembers its
  // own active sub-tab independently). Defaults to 'body' on open.
  subTab: RequestSubTab;
  lastResult: RunResult | null;
  sending: boolean;
  dirty: boolean;
};

type OpenInput = Omit<Tab, 'id' | 'subTab' | 'lastResult' | 'sending' | 'dirty'>;

type State = {
  tabs: Tab[];
  activeId: string | null;
  openRequestTab: (input: OpenInput) => void;
  closeTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<Tab>) => void;
  setActive: (id: string) => void;
  setSubTab: (id: string, subTab: Tab['subTab']) => void;
  setSending: (id: string, sending: boolean) => void;
  setResult: (id: string, result: RunResult) => void;
  markClean: (id: string) => void;
};

let nextId = 1;
const newId = () => `tab-${nextId++}`;

export const useTabsStore = create<State>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeId: null,

      openRequestTab(input) {
        const existing = get().tabs.find(
          (t) => t.collectionId === input.collectionId && t.requestId === input.requestId && t.collectionId !== null
        );
        if (existing) {
          set({ activeId: existing.id });
          return;
        }
        const id = newId();
        set({
          tabs: [
            ...get().tabs,
            { ...input, id, subTab: 'body', lastResult: null, sending: false, dirty: false },
          ],
          activeId: id,
        });
      },

      closeTab(id) {
        const { tabs, activeId } = get();
        const remaining = tabs.filter((t) => t.id !== id);
        let nextActive = activeId;
        if (activeId === id) {
          nextActive = remaining[remaining.length - 1]?.id ?? null;
        }
        set({ tabs: remaining, activeId: nextActive });
      },

      updateTab(id, patch) {
        set({
          tabs: get().tabs.map((t) => (t.id === id ? { ...t, ...patch, dirty: true } : t)),
        });
      },

      setActive(id) {
        set({ activeId: id });
      },

      setSubTab(id, subTab) {
        // Sub-tab switches are UI navigation, not user edits — don't dirty.
        set({
          tabs: get().tabs.map((t) => (t.id === id ? { ...t, subTab } : t)),
        });
      },

      setSending(id, sending) {
        set({
          tabs: get().tabs.map((t) => (t.id === id ? { ...t, sending } : t)),
        });
      },

      setResult(id, result) {
        set({
          tabs: get().tabs.map((t) => (t.id === id ? { ...t, lastResult: result, sending: false } : t)),
        });
      },

      markClean(id) {
        set({
          tabs: get().tabs.map((t) => (t.id === id ? { ...t, dirty: false } : t)),
        });
      },
    }),
    {
      name: 'postman-clone-tabs',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Don't persist transient runtime state — only what's needed to
      // restore the workspace shape. lastResult is too big and sending
      // would get stuck if persisted mid-flight.
      partialize: (s) => ({
        tabs: s.tabs.map((t) => ({ ...t, lastResult: null, sending: false })),
        activeId: s.activeId,
      }),
      // v0 → v1: tabs gained per-tab subTab. Default existing tabs to
      // 'body' so they don't crash on rehydrate with subTab=undefined.
      migrate: (persisted: unknown, version: number) => {
        if (
          version < 1 &&
          persisted &&
          typeof persisted === 'object' &&
          Array.isArray((persisted as { tabs?: unknown }).tabs)
        ) {
          const p = persisted as { tabs: Array<Record<string, unknown>>; activeId: string | null };
          return {
            ...p,
            tabs: p.tabs.map((t) => ({ ...t, subTab: t.subTab ?? 'body' })),
          };
        }
        return persisted as State;
      },
    }
  )
);
