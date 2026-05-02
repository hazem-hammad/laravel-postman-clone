import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore, type ResponseSubTab, type WorkspaceLayout } from '@/stores/ui-store';
import { ResponseStatusBar } from './response-status-bar';
import { ResponseBodyView } from './response-body-view';
import { LayoutToggle } from '../workspace/layout-toggle';
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
        <div className="ml-auto flex items-center">
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
