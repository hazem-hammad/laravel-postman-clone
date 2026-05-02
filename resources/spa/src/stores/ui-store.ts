import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RequestSubTab = 'params' | 'headers' | 'body' | 'auth' | 'comments';
export type ResponseSubTab = 'body' | 'headers';
export type ResponseBodyFormat = 'pretty' | 'raw' | 'preview';
export type WorkspaceLayout = 'vertical' | 'horizontal';

type State = {
  sidebarCollapsed: boolean;
  requestSubTab: RequestSubTab;
  responseSubTab: ResponseSubTab;
  responseBodyFormat: ResponseBodyFormat;
  envPanelOpen: boolean;
  expandedTreeNodes: string[]; // collection ids and folder ids that are expanded
  workspaceLayout: WorkspaceLayout;

  toggleSidebar: () => void;
  setRequestSubTab: (t: RequestSubTab) => void;
  setResponseSubTab: (t: ResponseSubTab) => void;
  setResponseBodyFormat: (f: ResponseBodyFormat) => void;
  toggleEnvPanel: () => void;
  isExpanded: (id: string) => boolean;
  setExpanded: (id: string, expanded: boolean) => void;
  setWorkspaceLayout: (l: WorkspaceLayout) => void;
};

export const useUiStore = create<State>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      requestSubTab: 'body',
      responseSubTab: 'body',
      responseBodyFormat: 'pretty',
      envPanelOpen: false,
      expandedTreeNodes: [],
      workspaceLayout: 'vertical',

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRequestSubTab: (t) => set({ requestSubTab: t }),
      setResponseSubTab: (t) => set({ responseSubTab: t }),
      setResponseBodyFormat: (f) => set({ responseBodyFormat: f }),
      toggleEnvPanel: () => set((s) => ({ envPanelOpen: !s.envPanelOpen })),
      setWorkspaceLayout: (l) => set({ workspaceLayout: l }),

      isExpanded: (id) => get().expandedTreeNodes.includes(id),
      setExpanded: (id, expanded) =>
        set((s) => {
          const set = new Set(s.expandedTreeNodes);
          if (expanded) set.add(id);
          else set.delete(id);
          return { expandedTreeNodes: Array.from(set) };
        }),
    }),
    {
      name: 'postman-clone-ui',
      version: 1,
      // v0 (the original release) defaulted requestSubTab to 'params'.
      // The intended default is 'body' since that's what most users open
      // a request to look at first. One-time migration flips persisted
      // 'params' to 'body'; explicit user picks of 'headers'/'auth' are
      // preserved.
      migrate: (persisted: unknown, version: number) => {
        if (
          version < 1 &&
          persisted &&
          typeof persisted === 'object' &&
          (persisted as { requestSubTab?: string }).requestSubTab === 'params'
        ) {
          return { ...(persisted as Record<string, unknown>), requestSubTab: 'body' };
        }
        return persisted as State;
      },
    }
  )
);
