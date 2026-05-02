import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { useUiStore } from '@/stores/ui-store';
import { useMetaStore } from '@/stores/meta-store';
import { getRuntime } from '@/lib/runtime';

export function TopBar() {
  const { theme } = getRuntime();
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeId = useEnvironmentsStore((s) => s.activeId);
  const setActive = useEnvironmentsStore((s) => s.setActive);
  const historyCount = useHistoryStore((s) => s.total);
  const toggleEnv = useUiStore((s) => s.toggleEnvPanel);
  const gitBranch = useMetaStore((s) => s.gitBranch);

  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-zinc-200 bg-white">
      <div className="flex items-center gap-3">
        {theme.logo_url ? <img src={theme.logo_url} alt="" className="h-6" /> : null}
        <h1 className="text-sm font-semibold text-zinc-900">{theme.app_name}</h1>
        {gitBranch ? (
          <span
            title="Current git branch of the source code (the Postman collection may differ between branches)"
            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-300 bg-zinc-50 text-zinc-700"
          >
            <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden className="text-zinc-500">
              <path
                fill="currentColor"
                d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z"
              />
            </svg>
            {gitBranch}
          </span>
        ) : null}
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
