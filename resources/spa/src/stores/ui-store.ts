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
  expandedTreeNodes: string[]; // collection ids and folder ids that are expanded

  toggleSidebar: () => void;
  setRequestSubTab: (t: RequestSubTab) => void;
  setResponseSubTab: (t: ResponseSubTab) => void;
  setResponseBodyFormat: (f: ResponseBodyFormat) => void;
  toggleEnvPanel: () => void;
  isExpanded: (id: string) => boolean;
  setExpanded: (id: string, expanded: boolean) => void;
};

export const useUiStore = create<State>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      requestSubTab: 'params',
      responseSubTab: 'body',
      responseBodyFormat: 'pretty',
      envPanelOpen: false,
      expandedTreeNodes: [],

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRequestSubTab: (t) => set({ requestSubTab: t }),
      setResponseSubTab: (t) => set({ responseSubTab: t }),
      setResponseBodyFormat: (f) => set({ responseBodyFormat: f }),
      toggleEnvPanel: () => set((s) => ({ envPanelOpen: !s.envPanelOpen })),

      isExpanded: (id) => get().expandedTreeNodes.includes(id),
      setExpanded: (id, expanded) =>
        set((s) => {
          const set = new Set(s.expandedTreeNodes);
          if (expanded) set.add(id);
          else set.delete(id);
          return { expandedTreeNodes: Array.from(set) };
        }),
    }),
    { name: 'postman-clone-ui' }
  )
);
