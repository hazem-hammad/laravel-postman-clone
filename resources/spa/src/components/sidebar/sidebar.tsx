import { useState } from 'react';
import { CollectionTree } from './collection-tree';
import { HistoryList } from './history-list';

export function Sidebar() {
  return (
    <aside className="w-72 border-r border-line-subtle bg-surface flex flex-col h-full overflow-hidden text-fg">
      <div className="flex-1 overflow-y-auto py-1">
        <Section title="Collections" defaultOpen>
          <CollectionTree />
        </Section>
        <Section title="History" defaultOpen>
          <HistoryList />
        </Section>
      </div>
    </aside>
  );
}

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <section className="select-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-subtle hover:text-fg-muted"
      >
        <Chevron open={open} />
        {title}
      </button>
      {open ? <div className="pb-1">{children}</div> : null}
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="10"
      height="10"
      aria-hidden
      className={`text-fg-subtle transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path fill="currentColor" d="M6 12V4l5 4z" />
    </svg>
  );
}
