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
    <div className="border-b border-line-subtle bg-app">
      {/* Row 1: title + Save / Restore */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <HttpIcon />
        <h2 className="text-sm font-semibold text-fg truncate flex-1 min-w-0" title={tab.url}>
          {tab.name}
        </h2>
        {canSaveRestore ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSave}
              disabled={!tab.dirty}
              title={tab.dirty ? 'Save your local edits to localStorage' : 'No unsaved changes'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${
                tab.dirty
                  ? 'border-line text-fg bg-surface-2 hover:bg-surface-hover'
                  : 'border-line-subtle text-fg-subtle cursor-not-allowed bg-surface-2'
              }`}
            >
              <SaveIcon />
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
          </div>
        ) : null}
      </div>

      {/* Row 2: method dropdown + URL + Send */}
      <div className="flex items-stretch gap-2 px-4 pb-3">
        <div className="flex-1 flex items-stretch border border-line rounded-lg bg-surface-2 overflow-hidden focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40 transition-shadow">
          <div className="relative shrink-0">
            <span
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold pointer-events-none ${methodTextClass(tab.method)}`}
            >
              {short(tab.method)}
            </span>
            <select
              value={tab.method}
              onChange={(e) => update(tabId, { method: e.target.value })}
              className="appearance-none bg-transparent pl-3 pr-9 h-full text-[13px] font-bold text-transparent outline-none cursor-pointer w-[7rem] border-r border-line-subtle"
              aria-label="HTTP method"
            >
              {METHODS.map((m) => (
                <option key={m} value={m} className="bg-surface text-fg">
                  {m}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 16 16"
              width="10"
              height="10"
              aria-hidden
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
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
        <button
          onClick={onSend}
          disabled={tab.sending}
          className="px-7 py-2 rounded-lg text-sm font-semibold bg-accent hover:bg-accent-hover text-accent-text disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm shadow-accent/30 transition-colors"
        >
          {tab.sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function short(m: string): string {
  const upper = m.toUpperCase();
  if (upper === 'DELETE') return 'DEL';
  if (upper === 'OPTIONS') return 'OPT';
  return upper;
}

function HttpIcon() {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-md border shrink-0"
      style={{
        background: 'var(--pc-status-info-bg)',
        borderColor: 'transparent',
        color: 'var(--pc-status-info)',
      }}
      aria-hidden
    >
      <svg viewBox="0 0 24 16" width="22" height="14">
        <text
          x="12"
          y="12"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          fontSize="9"
          fill="currentColor"
        >
          HTTP
        </text>
      </svg>
    </span>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
      <path
        fill="currentColor"
        d="M11.7 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V4.3a1.5 1.5 0 0 0-.44-1.06l-1.8-1.8A1.5 1.5 0 0 0 11.7 2zM5 3h5v3H5V3zm0 7h6v3H5v-3z"
      />
    </svg>
  );
}
