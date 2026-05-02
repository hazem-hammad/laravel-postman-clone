import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RequestSubTab = 'params' | 'headers' | 'body' | 'auth';
export type ResponseSubTab = 'body' | 'headers';
export type ResponseBodyFormat = 'pretty' | 'raw' | 'preview';

type State = {
  sidebarCollapsed: boolean;
  requestSubTab: RequestSubTab;
  responseSubTab: ResponseSubTab;
  responseBodyFormat: ResponseBodyFormat;
  envPanelOpen: boolean;

  toggleSidebar: () => void;
  setRequestSubTab: (t: RequestSubTab) => void;
  setResponseSubTab: (t: ResponseSubTab) => void;
  setResponseBodyFormat: (f: ResponseBodyFormat) => void;
  toggleEnvPanel: () => void;
};

export const useUiStore = create<State>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      requestSubTab: 'params',
      responseSubTab: 'body',
      responseBodyFormat: 'pretty',
      envPanelOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRequestSubTab: (t) => set({ requestSubTab: t }),
      setResponseSubTab: (t) => set({ responseSubTab: t }),
      setResponseBodyFormat: (f) => set({ responseBodyFormat: f }),
      toggleEnvPanel: () => set((s) => ({ envPanelOpen: !s.envPanelOpen })),
    }),
    { name: 'postman-clone-ui' }
  )
);
