import { useMemo } from 'react';
import type { RunResult } from '@/api/types';
import { useUiStore, type ResponseBodyFormat } from '@/stores/ui-store';

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
      <div className="flex-1 p-3 text-xs text-zinc-400">
        No response body. The error is shown in the banner above.
      </div>
    );
  }

  const body = result.body ?? '';
  const isHtml = contentType.includes('text/html');
  const isImage = contentType.startsWith('image/');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <FormatToolbar value={fmt} onChange={setFmt} contentType={contentType} />
      {fmt === 'pretty' && (
        <pre className="flex-1 overflow-auto p-3 text-xs font-mono bg-zinc-50 whitespace-pre">
          {pretty}
        </pre>
      )}
      {fmt === 'raw' && (
        <pre className="flex-1 overflow-auto p-3 text-xs font-mono bg-zinc-50 whitespace-pre-wrap break-all">
          {body}
        </pre>
      )}
      {fmt === 'preview' && (
        <PreviewBody body={body} contentType={contentType} isHtml={isHtml} isImage={isImage} />
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
    <div className="px-3 py-1.5 border-b border-zinc-200 flex items-center gap-2 text-xs bg-white">
      <div className="inline-flex rounded border border-zinc-300 overflow-hidden">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`px-3 py-1 ${
              value === f.id
                ? 'bg-primary text-primary-text'
                : 'bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {contentType ? (
        <span className="text-zinc-400 font-mono">{contentType}</span>
      ) : null}
    </div>
  );
}

function PreviewBody({
  body, contentType, isHtml, isImage,
}: {
  body: string;
  contentType: string;
  isHtml: boolean;
  isImage: boolean;
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
      <div className="flex-1 overflow-auto p-3 bg-zinc-50 flex items-center justify-center">
        <img src={dataUrl} alt="response" className="max-w-full max-h-full" />
      </div>
    );
  }
  // Fallback: show pretty-printed JSON
  let pretty = body;
  try {
    pretty = JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    // not JSON; show raw
  }
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-3 py-1.5 text-[11px] text-zinc-500 bg-zinc-50 border-b border-zinc-200">
        No HTML preview for <span className="font-mono">{contentType || 'unknown'}</span> — showing pretty JSON.
      </div>
      <pre className="flex-1 overflow-auto p-3 text-xs font-mono bg-zinc-50 whitespace-pre">
        {pretty}
      </pre>
    </div>
  );
}
