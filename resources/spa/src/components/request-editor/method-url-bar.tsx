import { useTabsStore } from '@/stores/tabs-store';
import { useOverridesStore } from '@/stores/overrides-store';
import { useCollectionsStore } from '@/stores/collections-store';
import { findRequestPath } from '@/lib/find-request';
import { VariableHighlightedInput } from '@/components/variable-highlighted-input';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function MethodUrlBar({ tabId, onSend }: { tabId: string; onSend: () => void }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  const markClean = useTabsStore((s) => s.markClean);
  const saveOverride = useOverridesStore((s) => s.saveOverride);
  const clearOverride = useOverridesStore((s) => s.clearOverride);
  const overrides = useOverridesStore((s) => s.overrides);
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const loaded = useCollectionsStore((s) => s.loaded);
  if (!tab) return null;

  const canSaveRestore = !!tab.collectionId && !!tab.requestId;
  const hasOverride =
    canSaveRestore && !!overrides[`${tab.collectionId}::${tab.requestId}`];

  const onSave = () => {
    if (!canSaveRestore) return;
    saveOverride(tab.collectionId!, tab.requestId!, {
      method: tab.method,
      url: tab.url,
      headers: tab.headers,
      params: tab.params,
      bodyMode: tab.bodyMode,
      body: tab.body,
    });
    markClean(tab.id);
  };

  const onRestoreDefault = async () => {
    if (!canSaveRestore) return;
    if (!confirm('Discard your local edits and restore the original request from the collection?')) return;

    clearOverride(tab.collectionId!, tab.requestId!);

    let detail = loaded[tab.collectionId!];
    if (!detail) {
      const fetched = await ensureLoaded(tab.collectionId!);
      if (!fetched) return;
      detail = fetched;
    }
    const found = findRequestPath(detail.items, tab.requestId!);
    if (!found) return;
    update(tab.id, {
      method: found.request.method,
      url: found.request.url,
      headers: found.request.headers,
      params: found.request.params,
      bodyMode: found.request.body_mode,
      body: found.request.body,
    });
    markClean(tab.id);
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b border-zinc-200">
      <select
        value={tab.method}
        onChange={(e) => update(tabId, { method: e.target.value })}
        className="border border-zinc-300 rounded px-2 py-1.5 text-sm font-medium"
      >
        {METHODS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <VariableHighlightedInput
        value={tab.url}
        onChange={(next) => update(tabId, { url: next })}
        placeholder="https://api.example.com/path or {{base_url}}/path"
        className="flex-1 border border-zinc-300 rounded"
      />
      {canSaveRestore ? (
        <>
          <button
            onClick={onSave}
            disabled={!tab.dirty}
            title={tab.dirty ? 'Save your local edits to localStorage' : 'No unsaved changes'}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${
              tab.dirty
                ? 'border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                : 'border-zinc-300 text-zinc-400 cursor-not-allowed'
            }`}
          >Save{hasOverride && !tab.dirty ? ' ✓' : ''}</button>
          {hasOverride ? (
            <button
              onClick={onRestoreDefault}
              title="Discard local edits and reload the original request from the collection"
              className="px-3 py-1.5 rounded text-xs font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >Restore</button>
          ) : null}
        </>
      ) : null}
      <button
        onClick={onSend}
        disabled={tab.sending}
        className="px-4 py-1.5 rounded text-sm font-medium bg-primary text-primary-text disabled:opacity-50"
      >
        {tab.sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
