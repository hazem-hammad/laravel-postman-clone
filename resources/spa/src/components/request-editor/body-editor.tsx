import { useTabsStore } from '@/stores/tabs-store';

export function BodyEditor({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  if (!tab) return null;

  return (
    <div className="p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-sm">
        <label className="text-zinc-500">Mode:</label>
        <select
          value={tab.bodyMode ?? ''}
          onChange={(e) => update(tabId, { bodyMode: e.target.value || null, body: e.target.value === 'raw' ? '' : null })}
          className="border border-zinc-300 rounded px-2 py-1"
        >
          <option value="">none</option>
          <option value="raw">raw (JSON / text)</option>
          <option value="urlencoded">urlencoded</option>
        </select>
      </div>
      {tab.bodyMode === 'raw' ? (
        <textarea
          value={typeof tab.body === 'string' ? tab.body : ''}
          onChange={(e) => update(tabId, { body: e.target.value })}
          className="flex-1 border border-zinc-300 rounded p-2 font-mono text-sm"
          placeholder='{"name": "value"}'
          spellCheck={false}
        />
      ) : tab.bodyMode === null ? (
        <p className="text-xs text-zinc-400">No body.</p>
      ) : (
        <p className="text-xs text-zinc-400">{tab.bodyMode} editor not yet implemented.</p>
      )}
    </div>
  );
}
