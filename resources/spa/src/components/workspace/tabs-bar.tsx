import { useTabsStore } from '@/stores/tabs-store';

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-red-600',
};

export function TabsBar() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const setActive = useTabsStore((s) => s.setActive);
  const closeTab = useTabsStore((s) => s.closeTab);

  if (tabs.length === 0) return <div className="h-9 border-b border-zinc-200 bg-white" />;

  return (
    <div className="h-9 border-b border-zinc-200 bg-white flex items-stretch overflow-x-auto">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-3 border-r border-zinc-200 cursor-pointer min-w-0 ${
            t.id === activeId ? 'bg-zinc-50' : 'hover:bg-zinc-50'
          }`}
          onClick={() => setActive(t.id)}
        >
          <span className={`text-[10px] font-bold ${METHOD_COLOR[t.method] ?? 'text-zinc-500'}`}>
            {t.method}
          </span>
          <span className="text-sm text-zinc-700 truncate max-w-[14rem]">{t.name}</span>
          {t.dirty ? <span className="text-zinc-400 text-xs">●</span> : null}
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
            className="text-zinc-400 hover:text-zinc-700 text-xs"
            aria-label={`Close ${t.name}`}
          >×</button>
        </div>
      ))}
    </div>
  );
}
