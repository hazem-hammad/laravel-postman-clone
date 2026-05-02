import { useTabsStore } from '@/stores/tabs-store';
import type { RequestSubTab } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';

const TABS: { id: RequestSubTab; label: string }[] = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' },
  { id: 'comments', label: 'Comments' },
];

export function RequestSubTabs({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const setSubTab = useTabsStore((s) => s.setSubTab);
  const showComments = useAuthStore((s) => Boolean(s.user?.hasRepoAccess));
  const counts = useLinkedIssuesStore((s) =>
    tab && tab.collectionId ? s.countsByCollection[tab.collectionId] : undefined,
  );
  if (!tab) return null;

  const active = tab.subTab;

  const hasContent = (id: RequestSubTab): boolean => {
    if (id === 'params') return tab.params.some((p) => p.key);
    if (id === 'headers') return tab.headers.some((h) => h.key);
    if (id === 'body') return tab.bodyMode !== null && tab.body !== null && tab.body !== '';
    return false;
  };

  const visibleTabs = TABS.filter((t) => t.id !== 'comments' || showComments);
  const requestCounts =
    tab.requestId && counts ? counts[tab.requestId] : undefined;
  const openCount = requestCounts?.open ?? 0;

  return (
    <div className="flex items-stretch border-b border-line-subtle bg-app px-3">
      {visibleTabs.map((t) => {
        const isActive = active === t.id;
        const dot = hasContent(t.id);
        return (
          <button
            key={t.id}
            onClick={() => setSubTab(tabId, t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {t.label}
            {t.id === 'comments' && openCount > 0 ? (
              <span className="ml-1 text-[10px] px-1 rounded-full bg-status-success/20 text-status-success">
                {openCount}
              </span>
            ) : null}
            {dot && !isActive ? (
              <span className="w-1 h-1 rounded-full bg-accent" aria-hidden />
            ) : null}
            {isActive ? (
              <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-accent rounded-t" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
