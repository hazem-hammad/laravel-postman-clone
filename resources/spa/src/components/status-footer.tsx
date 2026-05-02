import { useMetaStore } from '@/stores/meta-store';
import { useTabsStore } from '@/stores/tabs-store';
import { useHistoryStore } from '@/stores/history-store';
import { useEnvironmentsStore } from '@/stores/environments-store';

/**
 * Postman-style footer status bar — terse counts and shortcuts.
 */
export function StatusFooter() {
  const tabs = useTabsStore((s) => s.tabs);
  const totalRuns = useHistoryStore((s) => s.total);
  const activeEnv = useEnvironmentsStore((s) => s.activeId);
  const branch = useMetaStore((s) => s.gitBranch);

  return (
    <footer className="h-6 px-3 flex items-center gap-3 text-[11px] text-fg-subtle border-t border-line-subtle bg-surface">
      {branch ? (
        <span className="inline-flex items-center gap-1">
          <BranchIcon />
          <span className="font-mono">{branch}</span>
        </span>
      ) : null}
      <span>{tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}</span>
      <span>·</span>
      <span>{totalRuns} {totalRuns === 1 ? 'run' : 'runs'}</span>
      <span>·</span>
      <span>env: <span className="font-mono">{activeEnv ?? 'none'}</span></span>
      <span className="ml-auto inline-flex items-center gap-3">
        <FooterAction>Globals</FooterAction>
        <FooterAction>Vault</FooterAction>
        <FooterAction>Tools</FooterAction>
      </span>
    </footer>
  );
}

function FooterAction({ children }: { children: React.ReactNode }) {
  return (
    <button className="hover:text-fg transition-colors" type="button">
      {children}
    </button>
  );
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden>
      <path
        fill="currentColor"
        d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z"
      />
    </svg>
  );
}
