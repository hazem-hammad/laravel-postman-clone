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
    <header className="h-12 px-3 flex items-center gap-3 border-b border-line-subtle bg-surface text-fg">
      {/* Left: app name + branch */}
      <div className="flex items-center gap-2 min-w-0">
        {theme.logo_url ? (
          <img src={theme.logo_url} alt="" className="h-5" />
        ) : (
          <div className="w-5 h-5 rounded-sm bg-primary text-primary-text flex items-center justify-center font-bold text-[10px]">
            P
          </div>
        )}
        <h1 className="text-sm font-semibold whitespace-nowrap">{theme.app_name}</h1>
        {gitBranch ? (
          <span
            title="Current git branch of the source code (the Postman collection may differ between branches)"
            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border border-line bg-surface-2 text-fg-muted hover:text-fg"
          >
            <BranchIcon />
            {gitBranch}
          </span>
        ) : null}
      </div>

      {/* Middle: search */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search requests, history, environments…"
            className="w-full bg-surface-2 border border-line-subtle rounded-md pl-9 pr-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-line"
          />
        </div>
      </div>

      {/* Right: env / runs / settings */}
      <div className="flex items-center gap-2">
        <select
          value={activeId ?? ''}
          onChange={(e) => setActive(e.target.value || null)}
          title="Active environment for {{var}} substitution"
          className="bg-surface-2 border border-line-subtle rounded-md px-2 py-1 text-xs text-fg focus:border-line outline-none"
        >
          <option value="">No environment</option>
          {environments.map((e) => (
            <option key={e.id} value={e.id}>{e.id}</option>
          ))}
        </select>
        <button
          onClick={toggleEnv}
          title="Manage environment variables"
          className="text-xs px-2 py-1 rounded-md border border-line-subtle bg-surface-2 hover:bg-surface-hover text-fg"
        >
          Manage env
        </button>
        <span
          title={`${historyCount} runs in history`}
          className="text-[11px] px-2 py-1 rounded-md bg-surface-2 text-fg-muted"
        >
          {historyCount} runs
        </span>
      </div>
    </header>
  );
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden className="text-fg-subtle">
      <path
        fill="currentColor"
        d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.03a.75.75 0 1 1-1.06 1.06l-3.04-3.03z"
      />
    </svg>
  );
}
