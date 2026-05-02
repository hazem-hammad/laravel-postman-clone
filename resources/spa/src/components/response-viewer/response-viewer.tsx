import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore, type ResponseSubTab } from '@/stores/ui-store';
import { ResponseStatusBar } from './response-status-bar';
import { ResponseBodyView } from './response-body-view';

const TABS: { id: ResponseSubTab; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
];

export function ResponseViewer({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const sub = useUiStore((s) => s.responseSubTab);
  const setSub = useUiStore((s) => s.setResponseSubTab);
  if (!tab) return null;
  const result = tab.lastResult;

  return (
    <section className="flex-1 flex flex-col min-h-0 border-t border-zinc-200">
      <ResponseStatusBar result={result} />
      <div className="flex border-b border-zinc-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-4 py-1.5 text-xs border-b-2 ${
              sub === t.id ? 'border-primary text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto flex flex-col min-h-0">
        {sub === 'body' && <ResponseBodyView result={result} />}
        {sub === 'headers' && (
          <div className="p-3 text-xs font-mono">
            {result && Object.entries(result.headers).map(([k, v]) => (
              <div key={k}><span className="text-zinc-500">{k}:</span> {v.join(', ')}</div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
