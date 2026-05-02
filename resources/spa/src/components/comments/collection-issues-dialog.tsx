import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollectionsStore } from '@/stores/collections-store';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore } from '@/stores/ui-store';
import { applyOverride } from '@/stores/overrides-store';
import { findRequestPath } from '@/lib/find-request';
import type { LinkedIssue } from '@/api/issues';
import type { TreeNode } from '@/api/types';

type Filter = 'all' | 'open' | 'closed';

export function CollectionIssuesDialog({
  collectionId,
  onClose,
}: {
  collectionId: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const collection = useCollectionsStore((s) => s.entries.find((e) => e.id === collectionId));
  const detail = useCollectionsStore((s) => s.loaded[collectionId]);
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const issues = useLinkedIssuesStore((s) => s.issuesByCollection[collectionId] ?? []);
  const loadIssuesForCollection = useLinkedIssuesStore((s) => s.loadIssuesForCollection);
  const syncStatus = useLinkedIssuesStore((s) => s.syncStatus);
  const openTab = useTabsStore((s) => s.openRequestTab);
  const setSubTab = useTabsStore((s) => s.setSubTab);
  const setExpanded = useUiStore((s) => s.setExpanded);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!detail) await ensureLoaded(collectionId);
        const list = await loadIssuesForCollection(collectionId);
        if (!cancelled && list.length > 0) {
          await syncStatus(list.map((i) => i.id));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (filter === 'open' && i.issue_state !== 'open') return false;
      if (filter === 'closed' && i.issue_state === 'open') return false;
      if (q && !i.issue_title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [issues, filter, search]);

  const counts = useMemo(() => {
    let open = 0;
    let closed = 0;
    for (const i of issues) {
      if (i.issue_state === 'open') open++;
      else closed++;
    }
    return { open, closed, total: issues.length };
  }, [issues]);

  const onRowClick = (issue: LinkedIssue) => {
    if (!detail) return;
    const found = findRequestPath(detail.items as TreeNode[], issue.request_id);
    if (!found) return;
    const { request, folderPath } = found;
    setExpanded(collectionId, true);
    for (const fid of folderPath) setExpanded(`${collectionId}::folder::${fid}`, true);
    openTab(
      applyOverride({
        collectionId,
        requestId: request.id,
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        bodyMode: request.body_mode,
        body: request.body,
      }),
    );
    const activeId = useTabsStore.getState().activeId;
    if (activeId) setSubTab(activeId, 'comments');
    navigate(
      `/collections/${encodeURIComponent(collectionId)}/requests/${encodeURIComponent(request.id)}`,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-6 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-line rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b border-line-subtle">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-fg truncate">
              Issues — {collection?.name ?? collectionId}
            </div>
            <div className="text-[11px] text-fg-subtle mt-0.5">
              {counts.total} total · {counts.open} open · {counts.closed} closed
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg p-1"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path
                fill="currentColor"
                d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"
              />
            </svg>
          </button>
        </header>

        <div className="px-4 py-2 border-b border-line-subtle flex items-center gap-2 bg-surface-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title…"
            className="flex-1 bg-surface border border-line-subtle rounded px-2 py-1 text-xs text-fg outline-none focus:border-line"
          />
          <div className="flex border border-line-subtle rounded overflow-hidden bg-surface">
            {(['all', 'open', 'closed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-medium capitalize ${
                  filter === f
                    ? 'bg-accent text-accent-text'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-hover'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-fg-subtle">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-fg-subtle">
              {issues.length === 0
                ? 'No issues filed in this collection yet.'
                : 'No issues match the current filter.'}
            </div>
          ) : (
            <ul className="divide-y divide-line-subtle">
              {filtered.map((i) => (
                <IssueRow
                  key={i.id}
                  issue={i}
                  requestName={
                    detail
                      ? findRequestPath(detail.items as TreeNode[], i.request_id)?.request.name ?? null
                      : null
                  }
                  onClick={() => onRowClick(i)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueRow({
  issue,
  requestName,
  onClick,
}: {
  issue: LinkedIssue;
  requestName: string | null;
  onClick: () => void;
}) {
  const stateStyle =
    issue.issue_state === 'open'
      ? 'bg-status-success/15 text-status-success border-status-success/40'
      : 'bg-fg-subtle/15 text-fg-muted border-fg-subtle/40';
  const stateLabel = issue.issue_state === 'open' ? 'Open' : 'Closed';

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-surface-hover"
      >
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${stateStyle}`}
        >
          {stateLabel}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-fg truncate">
            #{issue.issue_number} {issue.issue_title}
          </div>
          <div className="text-[11px] text-fg-subtle truncate mt-0.5">
            {requestName ? (
              <>↳ {requestName}</>
            ) : (
              <span className="italic">request not in current tree</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-fg-subtle shrink-0">
          {issue.assignee_login ? <span>@{issue.assignee_login}</span> : null}
          <span title={`${issue.comment_count} comment(s)`}>💬 {issue.comment_count}</span>
        </div>
      </button>
    </li>
  );
}
