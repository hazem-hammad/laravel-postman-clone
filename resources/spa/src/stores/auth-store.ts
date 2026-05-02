import { create } from 'zustand';

export type AuthUser = {
  id: number;
  githubLogin: string;
  name: string | null;
  avatarUrl: string;
  hasRepoAccess: boolean;
};

type State = {
  user: AuthUser | null;
  enabled: boolean;
  repo: string | null;
  setEnabled: (b: boolean) => void;
  setRepo: (r: string | null) => void;
  setUser: (u: AuthUser | null) => void;
  signOut: () => void;
};

export const useAuthStore = create<State>((set) => ({
  user: null,
  enabled: false,
  repo: null,
  setEnabled: (b) => set({ enabled: b }),
  setRepo: (r) => set({ repo: r }),
  setUser: (u) => set({ user: u }),
  signOut: () => set({ user: null }),
}));
