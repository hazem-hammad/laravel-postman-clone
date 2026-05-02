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

  const filledCount = (id: RequestSubTab): number => {
    if (id === 'params') return tab.params.filter((p) => p.key && !p.disabled).length;
    if (id === 'headers') return tab.headers.filter((h) => h.key && !h.disabled).length;
    return 0;
  };
  const bodyHasContent =
    tab.bodyMode !== null && tab.body !== null && tab.body !== '';

  const visibleTabs = TABS.filter((t) => t.id !== 'comments' || showComments);
  const requestCounts = tab.requestId && counts ? counts[tab.requestId] : undefined;
  const openIssueCount = requestCounts?.open ?? 0;

  return (
    <div className="flex items-stretch border-b border-line-subtle bg-app px-4">
      {visibleTabs.map((t) => {
        const isActive = active === t.id;
        const filled = filledCount(t.id);
        const dot = t.id === 'body' && bodyHasContent;

        let badge: { text: string; tone: 'neutral' | 'success' } | null = null;
        if (t.id === 'comments' && openIssueCount > 0) {
          badge = { text: String(openIssueCount), tone: 'success' };
        } else if ((t.id === 'params' || t.id === 'headers') && filled > 0) {
          badge = { text: String(filled), tone: 'neutral' };
        }

        return (
          <button
            key={t.id}
            onClick={() => setSubTab(tabId, t.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
              isActive ? 'text-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {t.label}
            {badge ? (
              <span
                className={`text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
                  badge.tone === 'success'
                    ? 'bg-status-success/20 text-status-success'
                    : isActive
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-3 text-fg-muted'
                }`}
              >
                {badge.text}
              </span>
            ) : dot && !isActive ? (
              <span className="w-1 h-1 rounded-full bg-accent" aria-hidden />
            ) : null}
            {isActive ? (
              <span
                className="absolute left-2 right-2 -bottom-px h-[2px] bg-accent rounded-t"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
