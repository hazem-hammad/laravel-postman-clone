import { useEffect } from 'react';
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore } from '@/stores/ui-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { sendRun } from '@/api/runs';
import { ApiError } from '@/api/client';
import { TabsBar } from './tabs-bar';
import { EmptyState } from './empty-state';
import { MethodUrlBar } from '../request-editor/method-url-bar';
import { RequestEditor } from '../request-editor/request-editor';
import { ResponseViewer } from '../response-viewer/response-viewer';

export function Workspace() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const setActive = useTabsStore((s) => s.setActive);
  const setSending = useTabsStore((s) => s.setSending);
  const setResult = useTabsStore((s) => s.setResult);
  const layout = useUiStore((s) => s.workspaceLayout);
  const tab = tabs.find((t) => t.id === activeId) ?? null;

  // Recover from inconsistent state — if activeId points to a tab that no
  // longer exists (or is null while tabs has entries), promote the last
  // tab. This can happen when an effect resurrects state mid-close, or when
  // persisted state lands with a stale activeId.
  useEffect(() => {
    if (tabs.length > 0 && (activeId === null || !tabs.find((t) => t.id === activeId))) {
      setActive(tabs[tabs.length - 1].id);
    }
  }, [activeId, tabs, setActive]);

  const send = async () => {
    if (!tab) return;
    setSending(tab.id, true);
    try {
      const envId = useEnvironmentsStore.getState().activeId;
      const res = await sendRun({
        method: tab.method,
        url: tab.url,
        headers: tab.headers,
        // Active params are encoded into the URL via the URL ↔ Params sync,
        // so resending them here would double them up.
        params: [],
        body_mode: tab.bodyMode,
        body: tab.body,
        environment_id: envId,
        collection_id: tab.collectionId,
        request_id: tab.requestId,
        request_name: tab.name,
      });
      setResult(tab.id, res.result);
      void useHistoryStore.getState().refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        const payload = (e.payload ?? {}) as {
          message?: string;
          error?: { kind?: string; message?: string; missing?: string[] };
        };
        const apiKind = payload.error?.kind;
        const apiMessage =
          payload.error?.message ??
          (Array.isArray(payload.error?.missing)
            ? `Unresolved variable(s): ${payload.error!.missing!.join(', ')}`
            : undefined) ??
          payload.message ??
          `HTTP ${e.status}`;
        setResult(tab.id, {
          status: null, headers: {}, body: JSON.stringify(e.payload, null, 2),
          body_truncated: false, size_bytes: null, timing_ms: 0,
          error_kind: apiKind ?? 'invalid_request',
          error_message: `${apiMessage} (HTTP ${e.status})`,
        });
      } else {
        setResult(tab.id, {
          status: null, headers: {}, body: null, body_truncated: false,
          size_bytes: null, timing_ms: 0,
          error_kind: 'unknown',
          error_message: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setSending(tab.id, false);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-app text-fg">
      <TabsBar />
      {tab === null ? <EmptyState /> : (
        <>
          {/* URL bar — always full workspace width, regardless of layout */}
          <MethodUrlBar tabId={tab.id} onSend={send} />
          <div
            className={`flex-1 flex overflow-hidden min-h-0 ${
              layout === 'horizontal' ? 'flex-row' : 'flex-col'
            }`}
          >
            <RequestEditor tabId={tab.id} layout={layout} />
            <ResponseViewer tabId={tab.id} layout={layout} />
          </div>
        </>
      )}
    </main>
  );
}
