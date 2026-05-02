import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCollectionsStore } from '@/stores/collections-store';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore } from '@/stores/ui-store';
import { applyOverride } from '@/stores/overrides-store';
import { methodTextClass } from '@/lib/method-style';
import type { CollectionEntry, FolderNode, RequestNode, TreeNode } from '@/api/types';

export function CollectionTree({
  onShowIssues,
}: {
  onShowIssues?: (collectionId: string) => void;
}) {
  const entries = useCollectionsStore((s) => s.entries);
  const [filter, setFilter] = useState('');
  const q = filter.trim().toLowerCase();

  if (entries.length === 0) {
    return <div className="text-xs text-fg-subtle px-3 py-1">No collections configured.</div>;
  }

  return (
    <div>
      <div className="px-3 pb-2">
        <div className="relative">
          <svg
            viewBox="0 0 16 16"
            width="11"
            height="11"
            aria-hidden
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          >
            <path
              fill="currentColor"
              d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.03a.75.75 0 1 1-1.06 1.06l-3.04-3.03z"
            />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter requests…"
            className="w-full bg-surface-2 border border-line-subtle rounded-md pl-7 pr-2 py-1 text-xs text-fg placeholder:text-fg-subtle outline-none focus:border-line"
          />
        </div>
      </div>
      <ul>
        {entries.map((e) => (
          <CollectionNode key={e.id} entry={e} filter={q} onShowIssues={onShowIssues} />
        ))}
      </ul>
    </div>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="9"
      height="9"
      aria-hidden
      className={`text-fg-subtle transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path fill="currentColor" d="M6 12V4l5 4z" />
    </svg>
  );
}

function nodeMatchesFilter(item: TreeNode, q: string): boolean {
  if (!q) return true;
  if (item.type === 'request') {
    return (
      item.name.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      item.method.toLowerCase().includes(q)
    );
  }
  return item.items.some((c) => nodeMatchesFilter(c, q));
}

function CollectionNode({
  entry,
  filter,
  onShowIssues,
}: {
  entry: CollectionEntry;
  filter: string;
  onShowIssues?: (collectionId: string) => void;
}) {
  const isExpanded = useUiStore((s) => s.isExpanded(entry.id));
  const setExpanded = useUiStore((s) => s.setExpanded);
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const detail = useCollectionsStore((s) => s.loaded[entry.id]);
  const counts = useLinkedIssuesStore((s) => s.countsByCollection[entry.id]);
  const issueTotals = countTotals(counts);

  const onToggle = async () => {
    if (!isExpanded && !detail && !entry.missing) {
      await ensureLoaded(entry.id);
    }
    setExpanded(entry.id, !isExpanded);
  };

  return (
    <li>
      <div className="group flex items-center hover:bg-surface-hover">
        <button
          onClick={onToggle}
          className="flex-1 text-left px-3 py-1.5 text-sm flex items-center gap-1.5 min-w-0"
        >
          <Caret open={isExpanded} />
          <CollectionGlyph />
          <span
            className={
              entry.missing ? 'text-status-error' : 'text-fg font-medium truncate'
            }
          >
            {entry.name}
          </span>
          {entry.missing ? (
            <span className="text-[10px] text-status-error">(missing)</span>
          ) : null}
        </button>
        {!entry.missing && issueTotals.total > 0 && onShowIssues ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowIssues(entry.id);
            }}
            title={`${issueTotals.total} issue(s) — ${issueTotals.open} open, ${issueTotals.closed} closed`}
            className="mr-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border border-line-subtle bg-surface text-fg-muted hover:text-fg hover:border-line"
          >
            <CommentIcon />
            {issueTotals.total}
            {issueTotals.open > 0 ? (
              <span className="text-status-success">·{issueTotals.open}</span>
            ) : null}
          </button>
        ) : null}
      </div>
      {(isExpanded || filter) && detail ? (
        <ul className="ml-3 border-l border-line-subtle">
          {detail.items
            .filter((item) => nodeMatchesFilter(item, filter))
            .map((item) => (
              <TreeItem
                key={item.id}
                item={item}
                collectionId={entry.id}
                filter={filter}
              />
            ))}
        </ul>
      ) : null}
    </li>
  );
}

function countTotals(
  counts: Record<string, { open: number; closed: number }> | undefined,
): { total: number; open: number; closed: number } {
  if (!counts) return { total: 0, open: 0, closed: 0 };
  let open = 0;
  let closed = 0;
  for (const c of Object.values(counts)) {
    open += c.open;
    closed += c.closed;
  }
  return { total: open + closed, open, closed };
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden>
      <path
        fill="currentColor"
        d="M1 2.75A2.75 2.75 0 0 1 3.75 0h8.5A2.75 2.75 0 0 1 15 2.75v6.5A2.75 2.75 0 0 1 12.25 12H7.81l-3.13 3.13a.75.75 0 0 1-1.28-.53V12h-.65A2.75 2.75 0 0 1 1 9.25v-6.5z"
      />
    </svg>
  );
}

function CollectionGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className="text-fg-muted">
      <path
        fill="currentColor"
        d="M2 2.75A1.75 1.75 0 0 1 3.75 1h8.5A1.75 1.75 0 0 1 14 2.75v10.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25V2.75zM3.75 2.5a.25.25 0 0 0-.25.25v9.5h9V2.75a.25.25 0 0 0-.25-.25h-8.5z"
      />
    </svg>
  );
}

function FolderGlyph({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className="text-fg-muted">
      <path
        fill="currentColor"
        d="M1.75 2A1.75 1.75 0 0 0 0 3.75v9.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25V5.75A1.75 1.75 0 0 0 14.25 4H7.5L6.397 2.526A1.25 1.25 0 0 0 5.395 2H1.75z"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className="text-fg-muted">
      <path
        fill="currentColor"
        d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-7.5A1.75 1.75 0 0 0 14.25 4H8.5L7.397 2.526A1.25 1.25 0 0 0 6.395 2H1.75z"
      />
    </svg>
  );
}

function TreeItem({
  item,
  collectionId,
  filter,
}: {
  item: TreeNode;
  collectionId: string;
  filter: string;
}) {
  if (item.type === 'folder') {
    return <FolderItem item={item} collectionId={collectionId} filter={filter} />;
  }
  return <RequestItem item={item} collectionId={collectionId} />;
}

function FolderItem({
  item,
  collectionId,
  filter,
}: {
  item: FolderNode;
  collectionId: string;
  filter: string;
}) {
  const folderKey = `${collectionId}::folder::${item.id}`;
  const isExpanded = useUiStore((s) => s.isExpanded(folderKey));
  const setExpanded = useUiStore((s) => s.setExpanded);
  const filteredChildren = useMemo(
    () => item.items.filter((c) => nodeMatchesFilter(c, filter)),
    [item.items, filter],
  );
  // When the user typed a filter, force-expand any folder that has surviving
  // descendants so they actually see the matches.
  const showChildren = isExpanded || (filter !== '' && filteredChildren.length > 0);
  return (
    <li>
      <button
        onClick={() => setExpanded(folderKey, !isExpanded)}
        className="w-full text-left px-2 py-1 text-sm hover:bg-surface-hover flex items-center gap-1.5"
      >
        <Caret open={showChildren} />
        <FolderGlyph open={showChildren} />
        <span className="text-fg truncate">{item.name}</span>
      </button>
      {showChildren ? (
        <ul className="ml-3 border-l border-line-subtle">
          {filteredChildren.map((c) => (
            <TreeItem key={c.id} item={c} collectionId={collectionId} filter={filter} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function RequestItem({ item, collectionId }: { item: RequestNode; collectionId: string }) {
  const open = useTabsStore((s) => s.openRequestTab);
  const navigate = useNavigate();
  const params = useParams();
  const isActive =
    params.collectionId &&
    params.requestId &&
    decodeURIComponent(params.collectionId) === collectionId &&
    decodeURIComponent(params.requestId) === item.id;

  return (
    <li>
      <button
        onClick={() => {
          open(applyOverride({
            collectionId,
            requestId: item.id,
            name: item.name,
            method: item.method,
            url: item.url,
            headers: item.headers,
            params: item.params,
            bodyMode: item.body_mode,
            body: item.body,
          }));
          navigate(`/collections/${encodeURIComponent(collectionId)}/requests/${encodeURIComponent(item.id)}`);
        }}
        className={`w-full text-left pl-3 pr-2 py-1.5 text-[13px] flex items-center gap-2 ${
          isActive
            ? 'bg-accent/10 text-fg border-l-2 border-accent'
            : 'hover:bg-surface-hover text-fg border-l-2 border-transparent'
        }`}
      >
        <MethodPill method={item.method} />
        <span className="truncate">{item.name}</span>
      </button>
    </li>
  );
}

function shortMethod(m: string): string {
  const upper = m.toUpperCase();
  if (upper === 'DELETE') return 'DEL';
  if (upper === 'OPTIONS') return 'OPT';
  return upper;
}

function MethodPill({ method }: { method: string }) {
  return (
    <span
      className={`text-[10px] font-bold w-11 shrink-0 text-center px-1.5 py-0.5 rounded bg-surface-3/60 ${methodTextClass(
        method,
      )}`}
    >
      {shortMethod(method)}
    </span>
  );
}
