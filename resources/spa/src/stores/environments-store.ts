import { create } from 'zustand';
import type { EnvironmentDetail, EnvironmentVariable } from '@/api/types';
import { listEnvironments } from '@/api/environments';
import { setEnvOverride, clearEnvOverride } from '@/api/env-overrides';

type State = {
  environments: EnvironmentDetail[];
  activeId: string | null;
  refresh: () => Promise<void>;
  setActive: (id: string | null) => void;
  setOverride: (envId: string, name: string, value: string) => Promise<void>;
  clearOverride: (envId: string, name: string) => Promise<void>;
};

export const useEnvironmentsStore = create<State>((set, get) => ({
  environments: [],
  activeId: null,

  async refresh() {
    const environments = await listEnvironments();
    set({ environments });
  },

  setActive(id) {
    set({ activeId: id });
  },

  async setOverride(envId, name, value) {
    const { variable } = await setEnvOverride(envId, name, value);
    const typed: EnvironmentVariable = {
      name: variable.name,
      value: variable.value,
      is_secret: variable.is_secret,
      source: (variable.source as EnvironmentVariable['source']) ?? 'override',
    };
    set({
      environments: get().environments.map((e) =>
        e.id !== envId ? e : { ...e, variables: replaceVar(e.variables, typed) }
      ),
    });
  },

  async clearOverride(envId, name) {
    await clearEnvOverride(envId, name);
    await get().refresh();
  },
}));

function replaceVar(rows: EnvironmentVariable[], replacement: EnvironmentVariable): EnvironmentVariable[] {
  const idx = rows.findIndex((r) => r.name === replacement.name);
  if (idx === -1) return [...rows, replacement];
  const next = rows.slice();
  next[idx] = replacement;
  return next;
}
