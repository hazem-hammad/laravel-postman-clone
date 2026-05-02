import { useTabsStore } from '@/stores/tabs-store';
import { TabsBar } from './tabs-bar';
import { EmptyState } from './empty-state';
import { RequestEditor } from '../request-editor/request-editor';
import { ResponseViewer } from '../response-viewer/response-viewer';

export function Workspace() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const tab = tabs.find((t) => t.id === activeId) ?? null;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      <TabsBar />
      {tab === null ? <EmptyState /> : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <RequestEditor tabId={tab.id} />
          <ResponseViewer tabId={tab.id} />
        </div>
      )}
    </main>
  );
}
