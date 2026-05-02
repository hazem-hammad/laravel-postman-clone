import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { useUiStore } from '@/stores/ui-store';
import { getRuntime } from '@/lib/runtime';

export function TopBar() {
  const { theme } = getRuntime();
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeId = useEnvironmentsStore((s) => s.activeId);
  const setActive = useEnvironmentsStore((s) => s.setActive);
  const historyCount = useHistoryStore((s) => s.total);
  const toggleEnv = useUiStore((s) => s.toggleEnvPanel);

  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-zinc-200 bg-white">
      <div className="flex items-center gap-3">
        {theme.logo_url ? <img src={theme.logo_url} alt="" className="h-6" /> : null}
        <h1 className="text-sm font-semibold text-zinc-900">{theme.app_name}</h1>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={activeId ?? ''}
          onChange={(e) => setActive(e.target.value || null)}
          className="text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
        >
          <option value="">No environment</option>
          {environments.map((e) => (
            <option key={e.id} value={e.id}>{e.id}</option>
          ))}
        </select>
        <button
          onClick={toggleEnv}
          className="text-xs px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-50"
        >Manage env</button>
        <span className="text-xs text-zinc-500">{historyCount} runs</span>
      </div>
    </header>
  );
}
