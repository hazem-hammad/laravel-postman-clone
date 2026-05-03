import { useMemo } from 'react';
import type { RunResult } from '@/api/types';
import { useUiStore, type ResponseBodyFormat } from '@/stores/ui-store';
import { highlightJson } from '@/lib/highlight-json';

const FORMATS: { id: ResponseBodyFormat; label: string }[] = [
  { id: 'pretty', label: 'Pretty' },
  { id: 'raw', label: 'Raw' },
  { id: 'preview', label: 'Preview' },
];

function getContentType(headers: Record<string, string[]>): string {
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (k.toLowerCase() === 'content-type') {
      return (v[0] ?? '').toLowerCase();
    }
  }
  return '';
}

export function ResponseBodyView({ result }: { result: RunResult | null }) {
  const fmt = useUiStore((s) => s.responseBodyFormat);
  const setFmt = useUiStore((s) => s.setResponseBodyFormat);

  const contentType = useMemo(
    () => (result ? getContentType(result.headers) : ''),
    [result]
  );

  const pretty = useMemo(() => {
    if (!result?.body) return '';
    try {
      return JSON.stringify(JSON.parse(result.body), null, 2);
    } catch {
      return result.body;
    }
  }, [result?.body]);

  if (!result) return null;

  if (result.error_kind && !result.body) {
    return (
      <div className="flex-1 p-3 text-xs text-fg-subtle">
        No response body. The error is shown in the banner above.
      </div>
    );
  }

  const body = result.body ?? '';
  const isHtml = contentType.includes('text/html');
  const isImage = contentType.startsWith('image/');

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0" style={{ background: 'var(--pc-code-bg)' }}>
      <FormatToolbar value={fmt} onChange={setFmt} contentType={contentType} />
      {fmt === 'pretty' && (
        <pre
          className="flex-1 min-w-0 overflow-auto p-3 text-xs font-mono whitespace-pre"
          style={{ color: 'var(--pc-code-text)' }}
        >
          {highlightJson(pretty)}
        </pre>
      )}
      {fmt === 'raw' && (
        <pre
          className="flex-1 min-w-0 overflow-auto p-3 text-xs font-mono whitespace-pre-wrap break-all"
          style={{ color: 'var(--pc-code-text)' }}
        >
          {body}
        </pre>
      )}
      {fmt === 'preview' && (
        <PreviewBody body={body} contentType={contentType} isHtml={isHtml} isImage={isImage} pretty={pretty} />
      )}
    </div>
  );
}

function FormatToolbar({
  value, onChange, contentType,
}: {
  value: ResponseBodyFormat;
  onChange: (f: ResponseBodyFormat) => void;
  contentType: string;
}) {
  return (
    <div className="px-3 py-1.5 border-b border-line-subtle flex items-center gap-1 text-xs bg-app">
      <div className="inline-flex items-center gap-0.5">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              value === f.id
                ? 'bg-surface-3 text-fg'
                : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {contentType ? (
        <span className="ml-2 text-fg-subtle font-mono text-[11px]">{contentType}</span>
      ) : null}
    </div>
  );
}

function PreviewBody({
  body, contentType, isHtml, isImage, pretty,
}: {
  body: string;
  contentType: string;
  isHtml: boolean;
  isImage: boolean;
  pretty: string;
}) {
  if (isHtml && body) {
    return (
      <iframe
        title="HTML preview"
        sandbox=""
        srcDoc={body}
        className="flex-1 w-full bg-white border-0"
      />
    );
  }
  if (isImage && body) {
    const dataUrl = body.startsWith('data:')
      ? body
      : `data:${contentType};base64,${btoa(body)}`;
    return (
      <div className="flex-1 overflow-auto p-3 flex items-center justify-center" style={{ background: 'var(--pc-code-bg)' }}>
        <img src={dataUrl} alt="response" className="max-w-full max-h-full" />
      </div>
    );
  }
  // Fallback: pretty-printed JSON
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-3 py-1.5 text-[11px] text-fg-subtle border-b border-line-subtle">
        No HTML preview for <span className="font-mono">{contentType || 'unknown'}</span> — showing pretty JSON.
      </div>
      <pre className="flex-1 overflow-auto p-3 text-xs font-mono whitespace-pre" style={{ color: 'var(--pc-code-text)' }}>
        {highlightJson(pretty)}
      </pre>
    </div>
  );
}
