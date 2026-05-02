import { useTabsStore } from '@/stores/tabs-store';
import { methodTextClass } from '@/lib/method-style';

export function TabsBar() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const setActive = useTabsStore((s) => s.setActive);
  const closeTab = useTabsStore((s) => s.closeTab);

  return (
    <div className="h-9 border-b border-line-subtle bg-surface flex items-stretch overflow-x-auto">
      {tabs.length === 0 ? (
        <div className="flex items-center px-3 text-xs text-fg-subtle">No requests open</div>
      ) : null}
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <div
            key={t.id}
            className={`group relative flex items-center gap-2 px-3 cursor-pointer min-w-0 max-w-[16rem] border-r border-line-subtle ${
              active
                ? 'bg-app text-fg'
                : 'text-fg-muted hover:text-fg hover:bg-surface-hover'
            }`}
            onClick={() => setActive(t.id)}
          >
            <span className={`text-[10px] font-bold ${methodTextClass(t.method)}`}>
              {short(t.method)}
            </span>
            <span className="text-xs truncate">{t.name}</span>
            {t.dirty ? (
              <span
                title="Unsaved changes"
                className="w-1.5 h-1.5 rounded-full bg-fg-muted shrink-0"
              />
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(t.id);
              }}
              className="text-fg-subtle hover:text-fg text-[14px] leading-none w-4 h-4 rounded hover:bg-surface-hover flex items-center justify-center opacity-0 group-hover:opacity-100"
              aria-label={`Close ${t.name}`}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

function short(m: string): string {
  const upper = m.toUpperCase();
  if (upper === 'DELETE') return 'DEL';
  if (upper === 'OPTIONS') return 'OPT';
  return upper;
}
