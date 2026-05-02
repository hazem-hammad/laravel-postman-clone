import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RequestSubTab = 'params' | 'headers' | 'body' | 'auth';
export type ResponseSubTab = 'body' | 'headers';

type State = {
  sidebarCollapsed: boolean;
  requestSubTab: RequestSubTab;
  responseSubTab: ResponseSubTab;
  envPanelOpen: boolean;

  toggleSidebar: () => void;
  setRequestSubTab: (t: RequestSubTab) => void;
  setResponseSubTab: (t: ResponseSubTab) => void;
  toggleEnvPanel: () => void;
};

export const useUiStore = create<State>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      requestSubTab: 'params',
      responseSubTab: 'body',
      envPanelOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRequestSubTab: (t) => set({ requestSubTab: t }),
      setResponseSubTab: (t) => set({ responseSubTab: t }),
      toggleEnvPanel: () => set((s) => ({ envPanelOpen: !s.envPanelOpen })),
    }),
    { name: 'postman-clone-ui' }
  )
);
