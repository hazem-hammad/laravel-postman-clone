import { useEffect } from 'react';
import { TopBar } from '@/components/top-bar';
import { Sidebar } from '@/components/sidebar/sidebar';
import { Workspace } from '@/components/workspace/workspace';
import { EnvPanel } from '@/components/env-panel/env-panel';
import { StatusFooter } from '@/components/status-footer';
import { useAuthStore } from '@/stores/auth-store';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import { useCollectionsStore } from '@/stores/collections-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { useMetaStore } from '@/stores/meta-store';
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
        useMetaStore.getState().setGitBranch(boot.git_branch);
        useAuthStore.getState().setEnabled(boot.github.enabled);
        useAuthStore.getState().setRepo(boot.github.repo);
        useAuthStore.getState().setUser(
          boot.github.current_user
            ? {
                id: boot.github.current_user.id,
                githubLogin: boot.github.current_user.github_login,
                name: boot.github.current_user.name,
                avatarUrl: boot.github.current_user.avatar_url,
                hasRepoAccess: boot.github.current_user.has_repo_access,
              }
            : null,
        );
      } catch (e) {
        console.error('bootstrap failed', e);
      }
    })();
    void useCollectionsStore.getState().refresh().then(() => {
      const entries = useCollectionsStore.getState().entries;
      for (const e of entries) {
        if (!e.missing) {
          void useLinkedIssuesStore.getState().loadCounts(e.id).catch(() => undefined);
        }
      }
    });
    void useEnvironmentsStore.getState().refresh();
    void useHistoryStore.getState().refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-app text-fg">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <Workspace />
      </div>
      <StatusFooter />
      <EnvPanel />
    </div>
  );
}
