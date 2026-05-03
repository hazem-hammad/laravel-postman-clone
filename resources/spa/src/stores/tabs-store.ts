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
  /**
   * Short-lived suppression set, keyed by `${collectionId}::${requestId}`.
   * Populated when the user closes a tab so the URL → store sync doesn't
   * resurrect it from stale `useParams()` values during the brief window
   * before react-router commits the navigate('/'). Each entry self-clears
   * after a tick.
   */
  recentlyClosedKeys: string[];
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
      recentlyClosedKeys: [],

      openRequestTab(input) {
        const key =
          input.collectionId && input.requestId
            ? `${input.collectionId}::${input.requestId}`
            : null;
        // If the user just closed this tab in the same tick, treat the
        // open request as a no-op so a stale URL → store re-fire can't
        // resurrect it. The suppression entry self-clears below, so a
        // genuine intentional re-open (sidebar click) on the next tick
        // succeeds normally.
        if (key && get().recentlyClosedKeys.includes(key)) return;

        const existing = get().tabs.find(
          (t) => t.collectionId === input.collectionId && t.requestId === input.requestId && t.collectionId !== null,
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
        const closed = tabs.find((t) => t.id === id);
        const remaining = tabs.filter((t) => t.id !== id);
        let nextActive = activeId;
        if (activeId === id) {
          nextActive = remaining[remaining.length - 1]?.id ?? null;
        }

        const key =
          closed && closed.collectionId && closed.requestId
            ? `${closed.collectionId}::${closed.requestId}`
            : null;

        set({
          tabs: remaining,
          activeId: nextActive,
          recentlyClosedKeys: key
            ? [...get().recentlyClosedKeys, key]
            : get().recentlyClosedKeys,
        });

        if (key) {
          // Clear the suppression after a tick so subsequent intentional
          // opens (sidebar click, deep link paste) work as expected.
          setTimeout(() => {
            set({
              recentlyClosedKeys: get().recentlyClosedKeys.filter((k) => k !== key),
            });
          }, 0);
        }
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
        // Never persist the suppression list — it's purely an in-memory
        // race-prevention guard scoped to a single click.
        recentlyClosedKeys: [],
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
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // If the persisted activeId points to a tab that no longer exists,
        // promote the last surviving tab — otherwise the workspace would
        // mount in the "tabs visible but EmptyState shown" inconsistent
        // state until the user clicks a tab manually.
        if (
          state.activeId &&
          !state.tabs.find((t) => t.id === state.activeId)
        ) {
          state.activeId = state.tabs[state.tabs.length - 1]?.id ?? null;
        }
      },
    }
  )
);
