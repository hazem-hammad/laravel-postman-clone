import type { RunResult } from '@/api/types';

function statusColor(status: number | null) {
  if (status === null) return 'bg-zinc-200 text-zinc-700';
  if (status < 300) return 'bg-emerald-100 text-emerald-800';
  if (status < 400) return 'bg-blue-100 text-blue-800';
  if (status < 500) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ResponseStatusBar({ result }: { result: RunResult | null }) {
  if (!result) return <div className="px-3 py-2 text-xs text-zinc-400">No response yet — hit Send.</div>;

  if (result.error_kind) {
    return (
      <div className="px-3 py-2 flex items-center gap-3 bg-red-50 border-b border-red-200 text-sm">
        <span className="font-semibold text-red-800">{result.error_kind.toUpperCase()}</span>
        <span className="text-red-700">{result.error_message}</span>
        <span className="ml-auto text-xs text-red-600">{result.timing_ms} ms</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 flex items-center gap-3 border-b border-zinc-200 text-sm">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(result.status)}`}>
        {result.status ?? '—'}
      </span>
      <span className="text-zinc-600">{result.timing_ms} ms</span>
      <span className="text-zinc-600">{formatSize(result.size_bytes)}</span>
      {result.body_truncated ? (
        <span className="text-amber-600 text-xs">truncated at cap</span>
      ) : null}
    </div>
  );
}
