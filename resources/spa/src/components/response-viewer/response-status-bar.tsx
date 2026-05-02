import type { RunResult } from '@/api/types';

function statusVariant(status: number | null): { bg: string; fg: string; label: string } {
  if (status === null) return { bg: 'var(--pc-status-error-bg)', fg: 'var(--pc-status-error)', label: 'Error' };
  if (status < 300) return { bg: 'var(--pc-status-success-bg)', fg: 'var(--pc-status-success)', label: statusLabel(status) };
  if (status < 400) return { bg: 'var(--pc-status-info-bg)', fg: 'var(--pc-status-info)', label: statusLabel(status) };
  if (status < 500) return { bg: 'var(--pc-status-warn-bg)', fg: 'var(--pc-status-warn)', label: statusLabel(status) };
  return { bg: 'var(--pc-status-error-bg)', fg: 'var(--pc-status-error)', label: statusLabel(status) };
}

function statusLabel(status: number): string {
  const labels: Record<number, string> = {
    200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
    301: 'Moved', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
    409: 'Conflict', 410: 'Gone', 422: 'Unprocessable', 429: 'Too Many',
    500: 'Server Error', 502: 'Bad Gateway', 503: 'Unavailable', 504: 'Timeout',
  };
  return labels[status] ?? '';
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ResponseStatusBar({ result }: { result: RunResult | null }) {
  if (!result) {
    return (
      <div className="px-3 py-2 text-xs text-fg-subtle border-b border-line-subtle">
        No response yet — hit Send.
      </div>
    );
  }

  if (result.error_kind) {
    return (
      <div className="px-3 py-2 flex items-center gap-3 border-b text-xs"
        style={{ background: 'var(--pc-status-error-bg)', borderBottomColor: 'var(--pc-status-error)' }}>
        <span className="font-semibold" style={{ color: 'var(--pc-status-error)' }}>
          {result.error_kind.toUpperCase()}
        </span>
        <span className="text-fg flex-1 truncate">{result.error_message}</span>
        <span className="text-fg-muted">{result.timing_ms} ms</span>
      </div>
    );
  }

  const variant = statusVariant(result.status);

  return (
    <div className="px-3 py-2 flex items-center gap-3 border-b border-line-subtle text-xs">
      <span
        className="inline-flex items-baseline gap-1.5 px-2 py-0.5 rounded font-semibold"
        style={{ background: variant.bg, color: variant.fg }}
      >
        <span className="text-[13px] font-bold leading-none">{result.status ?? '—'}</span>
        {variant.label ? <span className="text-[11px] leading-none">{variant.label}</span> : null}
      </span>
      <span className="text-fg-muted">
        Time: <span className="text-status-success font-medium">{result.timing_ms} ms</span>
      </span>
      <span className="text-fg-muted">
        Size: <span className="text-status-success font-medium">{formatSize(result.size_bytes)}</span>
      </span>
      {result.body_truncated ? (
        <span className="text-status-warn text-[11px] ml-2">truncated at cap</span>
      ) : null}
    </div>
  );
}
