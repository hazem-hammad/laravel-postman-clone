import { useEffect, useRef, useState } from 'react';
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore, type ResponseSubTab, type WorkspaceLayout } from '@/stores/ui-store';
import { ResponseStatusBar } from './response-status-bar';
import { ResponseBodyView } from './response-body-view';
import { LayoutToggle } from '../workspace/layout-toggle';
import { buildCurl } from '@/lib/build-curl';
import type { RunResult } from '@/api/types';

const TABS: { id: ResponseSubTab; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
];

export function ResponseViewer({
  tabId,
  layout = 'vertical',
}: {
  tabId: string;
  layout?: WorkspaceLayout;
}) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const sub = useUiStore((s) => s.responseSubTab);
  const setSub = useUiStore((s) => s.setResponseSubTab);
  if (!tab) return null;
  const result = tab.lastResult;

  const headerCount = result ? Object.keys(result.headers ?? {}).length : 0;

  // In horizontal layout the divider becomes vertical (handled by RequestEditor's
  // border-r). Drop the border-t we'd use for the stacked layout.
  const sectionClass =
    layout === 'horizontal'
      ? 'flex-1 flex flex-col min-h-0 bg-app'
      : 'flex-1 flex flex-col min-h-0 border-t border-line-subtle bg-app';

  return (
    <section className={sectionClass}>
      <ResponseStatusBar result={result} />
      <div className="flex items-stretch border-b border-line-subtle pl-3 pr-2 bg-app">
        {TABS.map((t) => {
          const isActive = sub === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium ${
                isActive ? 'text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {t.label}
              {t.id === 'headers' && headerCount > 0 ? (
                <span className="text-[10px] text-fg-subtle">({headerCount})</span>
              ) : null}
              {isActive ? (
                <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-accent rounded-t" aria-hidden />
              ) : null}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <CopyMenu tabId={tabId} />
          <LayoutToggle />
        </div>
      </div>
      <div className="flex-1 overflow-auto flex flex-col min-h-0">
        {sub === 'body' && <ResponseBodyView result={result} />}
        {sub === 'headers' && <HeaderTable result={result} />}
      </div>
    </section>
  );
}

function CopyMenu({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const [open, setOpen] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  if (!tab) return null;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 1500);
    }
    setOpen(false);
  };

  const body = tab.lastResult?.body ?? '';
  const hasBody = body !== '' && body !== null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Copy options"
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-hover"
      >
        <CopyIcon />
        {copiedLabel ?? 'Copy'}
        <Caret />
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-56 z-30 bg-surface border border-line rounded-md shadow-lg overflow-hidden">
          <button
            onClick={() => hasBody && copy(String(body), 'Body copied')}
            disabled={!hasBody}
            className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover text-fg disabled:text-fg-subtle disabled:cursor-not-allowed flex flex-col gap-0.5"
          >
            <span className="font-medium">Copy response body</span>
            <span className="text-[10px] text-fg-subtle">
              {hasBody ? 'Plain text from the last run' : 'No response yet'}
            </span>
          </button>
          <button
            onClick={() => copy(buildCurl(tab), 'cURL copied')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover text-fg border-t border-line-subtle flex flex-col gap-0.5"
          >
            <span className="font-medium">Copy as cURL</span>
            <span className="text-[10px] text-fg-subtle">
              Reproduces the request in a terminal
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
      <path
        fill="currentColor"
        d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25z"
      />
      <path
        fill="currentColor"
        d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25z"
      />
    </svg>
  );
}

function Caret() {
  return (
    <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden>
      <path fill="currentColor" d="M4 6l4 4 4-4z" />
    </svg>
  );
}

function HeaderTable({ result }: { result: RunResult | null }) {
  if (!result) return <div className="p-3 text-xs text-fg-subtle">No response yet.</div>;
  const entries = Object.entries(result.headers ?? {});
  if (entries.length === 0) return <div className="p-3 text-xs text-fg-subtle">No headers.</div>;
  return (
    <table className="w-full text-xs font-mono">
      <thead className="text-[10px] uppercase tracking-wide text-fg-subtle bg-surface-2">
        <tr>
          <th className="px-3 py-1.5 text-left font-medium w-1/3">Key</th>
          <th className="px-3 py-1.5 text-left font-medium">Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="border-t border-line-subtle">
            <td className="px-3 py-1 text-fg-muted align-top">{k}</td>
            <td className="px-3 py-1 text-fg break-all">{v.join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
