import { useEffect } from 'react';
import { TopBar } from '@/components/top-bar';
import { Sidebar } from '@/components/sidebar/sidebar';
import { Workspace } from '@/components/workspace/workspace';
import { EnvPanel } from '@/components/env-panel/env-panel';
import { useCollectionsStore } from '@/stores/collections-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { fetchBootstrap } from '@/api/bootstrap';
import { useUrlSync } from '@/lib/use-url-sync';

export function App() {
  useUrlSync();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const boot = await fetchBootstrap();
        if (cancelled) return;
        useEnvironmentsStore.setState({
          activeId: boot.active_environment,
        });
        useHistoryStore.setState({ total: boot.history_count });
        useCollectionsStore.setState({
          entries: boot.collections.map((c) => ({ ...c })),
        });
      } catch (e) {
        console.error('bootstrap failed', e);
      }
    })();
    void useCollectionsStore.getState().refresh();
    void useEnvironmentsStore.getState().refresh();
    void useHistoryStore.getState().refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <Workspace />
      </div>
      <EnvPanel />
    </div>
  );
}
