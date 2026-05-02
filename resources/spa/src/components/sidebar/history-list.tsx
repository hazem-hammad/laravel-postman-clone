import { useEffect, useState } from 'react';
import { useHistoryStore } from '@/stores/history-store';
import { useTabsStore } from '@/stores/tabs-store';
import { showRun } from '@/api/history';
import type { RunRecordSummary } from '@/api/types';
import { formatAbsoluteTime, formatRelativeTime } from '@/lib/format-time';
import { methodTextClass } from '@/lib/method-style';

function useTick(intervalMs: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function statusColor(status: number | null) {
  if (status === null) return 'text-status-error';
  if (status < 300) return 'text-status-success';
  if (status < 400) return 'text-status-info';
  if (status < 500) return 'text-status-warn';
  return 'text-status-error';
}

export function HistoryList() {
  const recent = useHistoryStore((s) => s.recent);
  const open = useTabsStore((s) => s.openRequestTab);
  useTick(30_000);

  if (recent.length === 0) {
    return <div className="text-xs text-fg-subtle px-3 py-1">No history yet.</div>;
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
            title={formatAbsoluteTime(r.created_at)}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-hover flex flex-col gap-0.5"
          >
            <div className="flex items-center gap-2 min-w-0 w-full">
              <span className={`text-[10px] font-bold w-10 shrink-0 ${methodTextClass(r.method)}`}>
                {short(r.method)}
              </span>
              <span className={`text-[11px] font-mono ${statusColor(r.response_status)}`}>
                {r.response_status ?? r.error_kind ?? '—'}
              </span>
              <span className="text-fg truncate flex-1">{r.request_name ?? r.url_raw}</span>
            </div>
            <span className="text-[10px] text-fg-subtle pl-[2.75rem]">
              {formatRelativeTime(r.created_at)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function short(m: string): string {
  const upper = m.toUpperCase();
  if (upper === 'DELETE') return 'DEL';
  if (upper === 'OPTIONS') return 'OPT';
  return upper;
}
