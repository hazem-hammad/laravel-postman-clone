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
      <div className="flex items-center gap-2 text-xs">
        <label className="text-fg-muted">Mode:</label>
        <select
          value={tab.bodyMode ?? ''}
          onChange={(e) =>
            update(tabId, {
              bodyMode: e.target.value || null,
              body: e.target.value === 'raw' ? '' : null,
            })
          }
          className="bg-surface-2 border border-line-subtle rounded-md px-2 py-1 text-xs text-fg outline-none focus:border-line"
        >
          <option value="">none</option>
          <option value="raw">raw (JSON / text)</option>
          <option value="urlencoded">urlencoded</option>
        </select>
        {tab.bodyMode === 'raw' && isJsonish ? (
          <button
            onClick={formatJson}
            className="ml-auto text-[11px] px-2 py-1 rounded-md border border-line-subtle bg-surface-2 hover:bg-surface-hover text-fg"
            title="Pretty-print JSON"
          >
            Format
          </button>
        ) : null}
      </div>
      {tab.bodyMode === 'raw' ? (
        <JsonCodeArea
          value={bodyText}
          onChange={(next) => update(tabId, { body: next })}
          placeholder='{"name": "value"}'
          className="flex-1 min-h-[10rem] border border-line-subtle rounded-md overflow-hidden"
          style={{ background: 'var(--pc-code-bg)' }}
        />
      ) : tab.bodyMode === null ? (
        <p className="text-xs text-fg-subtle">No body.</p>
      ) : (
        <p className="text-xs text-fg-subtle">{tab.bodyMode} editor not yet implemented.</p>
      )}
    </div>
  );
}
