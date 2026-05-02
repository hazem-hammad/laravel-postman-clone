import { create } from 'zustand';
import type { EnvironmentDetail } from '@/api/types';
import { listEnvironments } from '@/api/environments';

type State = {
  environments: EnvironmentDetail[];
  activeId: string | null;
  refresh: () => Promise<void>;
  setActive: (id: string | null) => void;
};

export const useEnvironmentsStore = create<State>((set) => ({
  environments: [],
  activeId: null,
  async refresh() {
    const environments = await listEnvironments();
    set({ environments });
  },
  setActive(id) {
    set({ activeId: id });
  },
}));
