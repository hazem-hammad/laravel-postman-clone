import { useUiStore, type WorkspaceLayout } from '@/stores/ui-store';

/**
 * Two-button segmented control to switch between stacked (vertical) and
 * side-by-side (horizontal) request/response panes.
 */
export function LayoutToggle() {
  const layout = useUiStore((s) => s.workspaceLayout);
  const setLayout = useUiStore((s) => s.setWorkspaceLayout);

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md border border-line-subtle bg-surface-2 p-0.5"
      title="Switch layout (vertical / horizontal)"
    >
      <Btn
        active={layout === 'vertical'}
        onClick={() => setLayout('vertical')}
        label="Stack vertically (request above response)"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <rect x="2" y="2.5" width="12" height="5" rx="1" fill="currentColor" opacity="0.85" />
          <rect x="2" y="8.5" width="12" height="5" rx="1" fill="currentColor" opacity="0.45" />
        </svg>
      </Btn>
      <Btn
        active={layout === 'horizontal'}
        onClick={() => setLayout('horizontal')}
        label="Split side-by-side (request left, response right)"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <rect x="2" y="2.5" width="5.5" height="11" rx="1" fill="currentColor" opacity="0.85" />
          <rect x="8.5" y="2.5" width="5.5" height="11" rx="1" fill="currentColor" opacity="0.45" />
        </svg>
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
        active ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}
