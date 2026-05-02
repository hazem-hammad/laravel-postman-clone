import { create } from 'zustand';
import type { RunRecordSummary } from '@/api/types';
import { listHistory } from '@/api/history';

type State = {
  recent: RunRecordSummary[];
  total: number;
  loading: boolean;
  refresh: () => Promise<void>;
  prepend: (record: RunRecordSummary) => void;
};

export const useHistoryStore = create<State>((set) => ({
  recent: [],
  total: 0,
  loading: false,
  async refresh() {
    set({ loading: true });
    const page = await listHistory(50);
    set({ recent: page.data, total: page.meta.total, loading: false });
  },
  prepend(record) {
    set((s) => ({ recent: [record, ...s.recent].slice(0, 50), total: s.total + 1 }));
  },
}));
