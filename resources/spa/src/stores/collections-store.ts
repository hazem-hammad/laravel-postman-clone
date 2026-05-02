import { create } from 'zustand';
import type { CollectionDetail, CollectionEntry } from '@/api/types';
import { listCollections, showCollection } from '@/api/collections';

type State = {
  entries: CollectionEntry[];
  loaded: Record<string, CollectionDetail>;
  loadingIds: Set<string>;
  error: string | null;

  refresh: () => Promise<void>;
  ensureLoaded: (id: string) => Promise<CollectionDetail | null>;
};

export const useCollectionsStore = create<State>((set, get) => ({
  entries: [],
  loaded: {},
  loadingIds: new Set(),
  error: null,

  async refresh() {
    try {
      const entries = await listCollections();
      set({ entries, error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load collections' });
    }
  },

  async ensureLoaded(id) {
    const cached = get().loaded[id];
    if (cached) return cached;
    if (get().loadingIds.has(id)) return null;
    const next = new Set(get().loadingIds);
    next.add(id);
    set({ loadingIds: next });
    try {
      const detail = await showCollection(id);
      set({ loaded: { ...get().loaded, [id]: detail } });
      return detail;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : `Failed to load ${id}` });
      return null;
    } finally {
      const after = new Set(get().loadingIds);
      after.delete(id);
      set({ loadingIds: after });
    }
  },
}));
