import { useUiStore, type RequestSubTab } from '@/stores/ui-store';

const TABS: { id: RequestSubTab; label: string }[] = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' },
];

export function RequestSubTabs() {
  const active = useUiStore((s) => s.requestSubTab);
  const setActive = useUiStore((s) => s.setRequestSubTab);

  return (
    <div className="flex border-b border-zinc-200">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className={`px-4 py-2 text-sm border-b-2 ${
            active === t.id
              ? 'border-primary text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
