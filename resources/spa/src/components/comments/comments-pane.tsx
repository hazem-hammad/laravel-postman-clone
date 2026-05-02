import { useState } from 'react';
import { useTabsStore } from '@/stores/tabs-store';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import { IssueComposer } from './issue-composer';
import { IssueThreadList } from './issue-thread-list';

export function CommentsPane({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const [composerOpen, setComposerOpen] = useState(false);
  const issues = useLinkedIssuesStore((s) =>
    tab && tab.collectionId && tab.requestId
      ? s.issuesByKey[`${tab.collectionId}::${tab.requestId}`] ?? []
      : [],
  );
  if (!tab) return null;

  return (
    <div className="p-3 flex flex-col gap-3 h-full overflow-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setComposerOpen(true)}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent hover:bg-accent-hover text-accent-text"
        >
          + File new issue
        </button>
        <div className="ml-auto text-[11px] text-fg-subtle">
          {issues.length} issue(s) for this request
        </div>
      </div>
      {composerOpen ? (
        <IssueComposer tabId={tabId} onClose={() => setComposerOpen(false)} />
      ) : null}
      <IssueThreadList issues={issues} />
    </div>
  );
}
