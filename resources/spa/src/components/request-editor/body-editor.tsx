import { useTabsStore } from '@/stores/tabs-store';
import { JsonCodeArea } from '@/components/json-code-area';

export function BodyEditor({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);

  if (!tab) return null;

  const bodyText = typeof tab.body === 'string' ? tab.body : '';
  const isJsonish = bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[');

  const formatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(bodyText), null, 2);
      update(tabId, { body: formatted });
    } catch {
      // not valid JSON; leave body unchanged
    }
  };

  return (
    <div className="p-3 flex flex-col gap-2 h-full min-h-0">
      <div className="flex items-center gap-2 text-sm">
        <label className="text-zinc-500">Mode:</label>
        <select
          value={tab.bodyMode ?? ''}
          onChange={(e) =>
            update(tabId, {
              bodyMode: e.target.value || null,
              body: e.target.value === 'raw' ? '' : null,
            })
          }
          className="border border-zinc-300 rounded px-2 py-1"
        >
          <option value="">none</option>
          <option value="raw">raw (JSON / text)</option>
          <option value="urlencoded">urlencoded</option>
        </select>
        {tab.bodyMode === 'raw' && isJsonish ? (
          <button
            onClick={formatJson}
            className="ml-auto text-xs px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-50"
            title="Pretty-print JSON"
          >Format</button>
        ) : null}
      </div>
      {tab.bodyMode === 'raw' ? (
        <JsonCodeArea
          value={bodyText}
          onChange={(next) => update(tabId, { body: next })}
          placeholder='{"name": "value"}'
          className="flex-1 min-h-[10rem] border border-zinc-300 rounded bg-white overflow-hidden"
        />
      ) : tab.bodyMode === null ? (
        <p className="text-xs text-zinc-400">No body.</p>
      ) : (
        <p className="text-xs text-zinc-400">{tab.bodyMode} editor not yet implemented.</p>
      )}
    </div>
  );
}
