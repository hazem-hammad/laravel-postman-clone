import { useNavigate, useParams } from 'react-router-dom';
import { useCollectionsStore } from '@/stores/collections-store';
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore } from '@/stores/ui-store';
import { applyOverride } from '@/stores/overrides-store';
import { methodTextClass } from '@/lib/method-style';
import type { CollectionEntry, FolderNode, RequestNode, TreeNode } from '@/api/types';

export function CollectionTree() {
  const entries = useCollectionsStore((s) => s.entries);

  if (entries.length === 0) {
    return <div className="text-xs text-fg-subtle px-3 py-1">No collections configured.</div>;
  }

  return (
    <ul>
      {entries.map((e) => (
        <CollectionNode key={e.id} entry={e} />
      ))}
    </ul>
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

function CollectionNode({ entry }: { entry: CollectionEntry }) {
  const isExpanded = useUiStore((s) => s.isExpanded(entry.id));
  const setExpanded = useUiStore((s) => s.setExpanded);
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const detail = useCollectionsStore((s) => s.loaded[entry.id]);

  const onToggle = async () => {
    if (!isExpanded && !detail && !entry.missing) {
      await ensureLoaded(entry.id);
    }
    setExpanded(entry.id, !isExpanded);
  };

  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-hover flex items-center gap-1.5 group"
      >
        <Caret open={isExpanded} />
        <CollectionGlyph />
        <span
          className={
            entry.missing
              ? 'text-status-error'
              : 'text-fg font-medium truncate'
          }
        >
          {entry.name}
        </span>
        {entry.missing ? <span className="text-[10px] text-status-error">(missing)</span> : null}
      </button>
      {isExpanded && detail ? (
        <ul className="ml-3 border-l border-line-subtle">
          {detail.items.map((item) => <TreeItem key={item.id} item={item} collectionId={entry.id} />)}
        </ul>
      ) : null}
    </li>
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

function TreeItem({ item, collectionId }: { item: TreeNode; collectionId: string }) {
  if (item.type === 'folder') {
    return <FolderItem item={item} collectionId={collectionId} />;
  }
  return <RequestItem item={item} collectionId={collectionId} />;
}

function FolderItem({ item, collectionId }: { item: FolderNode; collectionId: string }) {
  const folderKey = `${collectionId}::folder::${item.id}`;
  const isExpanded = useUiStore((s) => s.isExpanded(folderKey));
  const setExpanded = useUiStore((s) => s.setExpanded);
  return (
    <li>
      <button
        onClick={() => setExpanded(folderKey, !isExpanded)}
        className="w-full text-left px-2 py-1 text-sm hover:bg-surface-hover flex items-center gap-1.5"
      >
        <Caret open={isExpanded} />
        <FolderGlyph open={isExpanded} />
        <span className="text-fg truncate">{item.name}</span>
      </button>
      {isExpanded ? (
        <ul className="ml-3 border-l border-line-subtle">
          {item.items.map((c) => <TreeItem key={c.id} item={c} collectionId={collectionId} />)}
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
        className={`w-full text-left pl-7 pr-2 py-1 text-sm flex items-center gap-2 ${
          isActive ? 'bg-surface-hover text-fg' : 'hover:bg-surface-hover text-fg'
        }`}
      >
        <span className={`text-[10px] font-bold w-10 shrink-0 ${methodTextClass(item.method)}`}>
          {shortMethod(item.method)}
        </span>
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
