import { useState } from 'react';
import { useTabsStore } from '@/stores/tabs-store';
import { highlightJson } from '@/lib/highlight-json';

export function BodyEditor({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  const [showPreview, setShowPreview] = useState(false);

  if (!tab) return null;

  const bodyText = typeof tab.body === 'string' ? tab.body : '';

  const formatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(bodyText), null, 2);
      update(tabId, { body: formatted });
    } catch {
      // not valid JSON; leave body unchanged
    }
  };

  const isJsonish = bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[');

  return (
    <div className="p-3 flex flex-col gap-2 h-full">
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
          <>
            <button
              onClick={formatJson}
              className="ml-auto text-xs px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-50"
              title="Pretty-print JSON (Ctrl+S equivalent)"
            >Format</button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`text-xs px-2 py-1 rounded border ${
                showPreview ? 'border-primary text-primary' : 'border-zinc-300 hover:bg-zinc-50'
              }`}
              title="Toggle a read-only colored preview"
            >Preview</button>
          </>
        ) : null}
      </div>
      {tab.bodyMode === 'raw' ? (
        <div className="flex-1 flex flex-col min-h-0 gap-2">
          <textarea
            value={bodyText}
            onChange={(e) => update(tabId, { body: e.target.value })}
            className="flex-1 min-h-[8rem] border border-zinc-300 rounded p-2 font-mono text-sm"
            placeholder='{"name": "value"}'
            spellCheck={false}
          />
          {showPreview && isJsonish ? (
            <pre className="flex-1 min-h-[8rem] overflow-auto p-2 border border-zinc-200 rounded bg-zinc-50 font-mono text-xs whitespace-pre">
              {highlightJson(safePretty(bodyText))}
            </pre>
          ) : null}
        </div>
      ) : tab.bodyMode === null ? (
        <p className="text-xs text-zinc-400">No body.</p>
      ) : (
        <p className="text-xs text-zinc-400">{tab.bodyMode} editor not yet implemented.</p>
      )}
    </div>
  );
}

function safePretty(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
