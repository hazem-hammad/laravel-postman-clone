import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore } from '@/stores/ui-store';
import { TabsBar } from './tabs-bar';
import { EmptyState } from './empty-state';
import { RequestEditor } from '../request-editor/request-editor';
import { ResponseViewer } from '../response-viewer/response-viewer';

export function Workspace() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const layout = useUiStore((s) => s.workspaceLayout);
  const tab = tabs.find((t) => t.id === activeId) ?? null;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-app text-fg">
      <TabsBar />
      {tab === null ? <EmptyState /> : (
        <div
          className={`flex-1 flex overflow-hidden ${
            layout === 'horizontal' ? 'flex-row' : 'flex-col'
          }`}
        >
          <RequestEditor tabId={tab.id} layout={layout} />
          <ResponseViewer tabId={tab.id} layout={layout} />
        </div>
      )}
    </main>
  );
}
