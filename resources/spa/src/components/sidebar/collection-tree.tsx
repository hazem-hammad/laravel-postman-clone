import { useState } from 'react';
import { useCollectionsStore } from '@/stores/collections-store';
import { useTabsStore } from '@/stores/tabs-store';
import type { CollectionEntry, FolderNode, RequestNode, TreeNode } from '@/api/types';

export function CollectionTree() {
  const entries = useCollectionsStore((s) => s.entries);

  if (entries.length === 0) {
    return <div className="text-xs text-zinc-400 px-3 py-1">No collections configured.</div>;
  }

  return (
    <ul>
      {entries.map((e) => (
        <CollectionNode key={e.id} entry={e} />
      ))}
    </ul>
  );
}

function CollectionNode({ entry }: { entry: CollectionEntry }) {
  const [expanded, setExpanded] = useState(false);
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const detail = useCollectionsStore((s) => s.loaded[entry.id]);

  const onToggle = async () => {
    if (!expanded && !detail && !entry.missing) {
      await ensureLoaded(entry.id);
    }
    setExpanded(!expanded);
  };

  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <span className="text-zinc-400">{expanded ? '▾' : '▸'}</span>
        <span className={entry.missing ? 'text-red-500' : 'text-zinc-700 font-medium'}>
          {entry.name}
        </span>
        {entry.missing ? <span className="text-xs text-red-500">(missing)</span> : null}
      </button>
      {expanded && detail ? (
        <ul className="ml-3 border-l border-zinc-200">
          {detail.items.map((item) => <TreeItem key={item.id} item={item} collectionId={entry.id} />)}
        </ul>
      ) : null}
    </li>
  );
}

function TreeItem({ item, collectionId }: { item: TreeNode; collectionId: string }) {
  if (item.type === 'folder') {
    return <FolderItem item={item} collectionId={collectionId} />;
  }
  return <RequestItem item={item} collectionId={collectionId} />;
}

function FolderItem({ item, collectionId }: { item: FolderNode; collectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-2 py-1 text-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <span className="text-zinc-400">{expanded ? '▾' : '▸'}</span>
        <span className="text-zinc-700">{item.name}</span>
      </button>
      {expanded ? (
        <ul className="ml-3 border-l border-zinc-200">
          {item.items.map((c) => <TreeItem key={c.id} item={c} collectionId={collectionId} />)}
        </ul>
      ) : null}
    </li>
  );
}

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-red-600',
};

function RequestItem({ item, collectionId }: { item: RequestNode; collectionId: string }) {
  const open = useTabsStore((s) => s.openRequestTab);
  return (
    <li>
      <button
        onClick={() => open({
          collectionId,
          requestId: item.id,
          name: item.name,
          method: item.method,
          url: item.url,
          headers: item.headers,
          params: item.params,
          bodyMode: item.body_mode,
          body: item.body,
        })}
        className="w-full text-left px-2 py-1 text-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <span className={`text-[10px] font-bold ${METHOD_COLOR[item.method] ?? 'text-zinc-500'}`}>
          {item.method}
        </span>
        <span className="text-zinc-700 truncate">{item.name}</span>
      </button>
    </li>
  );
}
