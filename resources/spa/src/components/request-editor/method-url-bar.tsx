import { useTabsStore } from '@/stores/tabs-store';
import { useOverridesStore } from '@/stores/overrides-store';
import { useCollectionsStore } from '@/stores/collections-store';
import { findRequestPath } from '@/lib/find-request';
import { syncParamsFromUrl } from '@/lib/url-params-sync';
import { methodTextClass } from '@/lib/method-style';
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
    <div className="flex items-center gap-2 px-3 py-2 border-b border-line-subtle bg-app">
      {/* Method + URL combined into one rounded shell */}
      <div className="flex-1 flex items-stretch border border-line rounded-md bg-surface-2 overflow-hidden focus-within:border-fg-subtle">
        <div className="relative shrink-0">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${methodTextClass(tab.method)}`}>
            {short(tab.method)}
          </span>
          <select
            value={tab.method}
            onChange={(e) => update(tabId, { method: e.target.value })}
            className="appearance-none bg-transparent pl-3 pr-7 py-1.5 text-xs font-bold text-transparent outline-none cursor-pointer w-[5.5rem] border-r border-line-subtle"
            aria-label="HTTP method"
          >
            {METHODS.map((m) => <option key={m} value={m} className="bg-surface text-fg">{m}</option>)}
          </select>
          <svg
            viewBox="0 0 16 16"
            width="9"
            height="9"
            aria-hidden
            className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          >
            <path fill="currentColor" d="M4 6l4 4 4-4z" />
          </svg>
        </div>
        <VariableHighlightedInput
          value={tab.url}
          onChange={(next) =>
            update(tabId, {
              url: next,
              params: syncParamsFromUrl(next, tab.params),
            })
          }
          placeholder="Enter URL or paste text"
          className="flex-1"
          inputClassName="text-fg"
        />
      </div>

      {canSaveRestore ? (
        <>
          <button
            onClick={onSave}
            disabled={!tab.dirty}
            title={tab.dirty ? 'Save your local edits to localStorage' : 'No unsaved changes'}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
              tab.dirty
                ? 'border-line text-fg bg-surface-2 hover:bg-surface-hover'
                : 'border-line-subtle text-fg-subtle cursor-not-allowed bg-surface-2'
            }`}
          >
            Save{hasOverride && !tab.dirty ? ' ✓' : ''}
          </button>
          {hasOverride ? (
            <button
              onClick={onRestoreDefault}
              title="Discard local edits and reload the original request from the collection"
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-line-subtle bg-surface-2 hover:bg-surface-hover text-fg"
            >
              Restore
            </button>
          ) : null}
        </>
      ) : null}

      <button
        onClick={onSend}
        disabled={tab.sending}
        className="px-5 py-1.5 rounded-md text-sm font-semibold bg-accent hover:bg-accent-hover text-accent-text disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {tab.sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}

function short(m: string): string {
  const upper = m.toUpperCase();
  if (upper === 'DELETE') return 'DEL';
  if (upper === 'OPTIONS') return 'OPT';
  return upper;
}
