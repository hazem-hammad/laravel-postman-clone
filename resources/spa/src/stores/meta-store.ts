import { create } from 'zustand';

/**
 * Read-only workspace metadata that comes from the bootstrap response.
 * Refreshed whenever App re-bootstraps. Not persisted.
 */
type State = {
  gitBranch: string | null;
  setGitBranch: (branch: string | null) => void;
};

export const useMetaStore = create<State>((set) => ({
  gitBranch: null,
  setGitBranch: (branch) => set({ gitBranch: branch }),
}));
