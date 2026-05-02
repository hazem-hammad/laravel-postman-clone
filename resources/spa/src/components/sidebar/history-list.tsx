import { useHistoryStore } from '@/stores/history-store';
import { useTabsStore } from '@/stores/tabs-store';
import { showRun } from '@/api/history';
import type { RunRecordSummary } from '@/api/types';

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-red-600',
};

function statusColor(status: number | null) {
  if (status === null) return 'text-red-600';
  if (status < 300) return 'text-emerald-600';
  if (status < 400) return 'text-blue-600';
  if (status < 500) return 'text-amber-600';
  return 'text-red-600';
}

export function HistoryList() {
  const recent = useHistoryStore((s) => s.recent);
  const open = useTabsStore((s) => s.openRequestTab);

  if (recent.length === 0) {
    return <div className="text-xs text-zinc-400 px-3 py-1">No history yet.</div>;
  }

  const onClick = async (run: RunRecordSummary) => {
    const full = await showRun(run.id);
    const payload = (full.request_payload_json ?? {}) as {
      headers?: Array<{ key: string; value: string; disabled?: boolean }>;
      params?: Array<{ key: string; value: string; disabled?: boolean }>;
      body_mode?: string | null;
      body?: unknown;
    };
    open({
      collectionId: full.collection_id,
      requestId: full.request_id,
      name: full.request_name ?? `${full.method} ${full.url_raw}`,
      method: full.method,
      url: full.url_raw,
      headers: payload.headers ?? [],
      params: payload.params ?? [],
      bodyMode: payload.body_mode ?? null,
      body: payload.body ?? null,
    });
  };

  return (
    <ul>
      {recent.map((r) => (
        <li key={r.id}>
          <button
            onClick={() => onClick(r)}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-200 flex items-center gap-2"
          >
            <span className={`text-[10px] font-bold ${METHOD_COLOR[r.method] ?? 'text-zinc-500'}`}>
              {r.method}
            </span>
            <span className={`text-xs ${statusColor(r.response_status)}`}>
              {r.response_status ?? r.error_kind ?? '—'}
            </span>
            <span className="text-zinc-700 truncate">{r.request_name ?? r.url_raw}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
