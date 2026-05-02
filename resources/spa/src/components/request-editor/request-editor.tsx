import { useTabsStore } from '@/stores/tabs-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { useUiStore } from '@/stores/ui-store';
import { sendRun } from '@/api/runs';
import { ApiError } from '@/api/client';
import { MethodUrlBar } from './method-url-bar';
import { RequestSubTabs } from './request-sub-tabs';
import { KeyValueTable } from './key-value-table';
import { BodyEditor } from './body-editor';
import { AuthEditor } from './auth-editor';

export function RequestEditor({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  const setSending = useTabsStore((s) => s.setSending);
  const setResult = useTabsStore((s) => s.setResult);
  const sub = useUiStore((s) => s.requestSubTab);
  if (!tab) return null;

  const send = async () => {
    setSending(tab.id, true);
    try {
      const envId = useEnvironmentsStore.getState().activeId;
      const res = await sendRun({
        method: tab.method,
        url: tab.url,
        headers: tab.headers,
        params: tab.params,
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
        const payload = (e.payload ?? {}) as { message?: string; error?: { kind?: string; message?: string; missing?: string[] } };
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
          error_kind: 'unknown', error_message: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setSending(tab.id, false);
    }
  };

  return (
    <section className="border-b border-zinc-200 flex flex-col" style={{ minHeight: '40%' }}>
      <MethodUrlBar tabId={tabId} onSend={send} />
      <RequestSubTabs />
      <div className="flex-1 overflow-auto">
        {sub === 'params' && (
          <KeyValueTable
            rows={tab.params}
            onChange={(params) => update(tab.id, { params })}
            placeholder="Param"
          />
        )}
        {sub === 'headers' && (
          <KeyValueTable
            rows={tab.headers}
            onChange={(headers) => update(tab.id, { headers })}
            placeholder="Header"
          />
        )}
        {sub === 'body' && <BodyEditor tabId={tab.id} />}
        {sub === 'auth' && <AuthEditor />}
      </div>
    </section>
  );
}
