import { useState } from 'react';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useUiStore } from '@/stores/ui-store';

export function EnvPanel() {
  const open = useUiStore((s) => s.envPanelOpen);
  const close = useUiStore((s) => s.toggleEnvPanel);
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeId = useEnvironmentsStore((s) => s.activeId);

  if (!open) return null;

  const env = environments.find((e) => e.id === activeId) ?? environments[0] ?? null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={close} aria-hidden />
      <aside className="fixed right-0 top-0 bottom-0 w-[28rem] bg-surface z-50 border-l border-line flex flex-col shadow-2xl text-fg">
        <header className="px-4 h-12 border-b border-line-subtle flex items-center justify-between">
          <h2 className="font-semibold text-fg">Environments</h2>
          <button onClick={close} className="text-fg-muted hover:text-fg w-7 h-7 rounded hover:bg-surface-hover flex items-center justify-center text-xl leading-none" aria-label="Close panel">×</button>
        </header>
        {env === null ? (
          <div className="p-4 text-sm text-fg-muted">No environments configured.</div>
        ) : (
          <EnvEditor env={env} />
        )}
      </aside>
    </>
  );
}

type EnvForEditor = {
  id: string;
  variables: Array<{ name: string; value: string; is_secret: boolean; source: string }>;
};

function EnvEditor({ env }: { env: EnvForEditor }) {
  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
      <div className="text-xs text-fg-muted leading-relaxed">
        Editing <span className="font-mono text-fg">{env.id}</span>. Edits are stored in{' '}
        <code className="px-1.5 py-0.5 bg-surface-2 border border-line-subtle rounded text-fg">
          storage/postman-clone/environments.local.json
        </code>{' '}
        (gitignored). The PHP config file is never written to.
      </div>
      <table className="w-full text-sm">
        <thead className="text-[10px] text-fg-subtle text-left uppercase tracking-wide">
          <tr className="border-b border-line-subtle">
            <th className="px-2 py-1.5 font-medium">Name</th>
            <th className="px-2 py-1.5 font-medium">Value</th>
            <th className="px-2 py-1.5 font-medium w-20">Source</th>
            <th className="px-2 py-1.5 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {env.variables.map((v) => (
            <VariableRow key={v.name} envId={env.id} v={v} />
          ))}
          {env.variables.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-xs text-fg-subtle py-6">
                No variables yet. Define some in <code className="text-fg">config/postman-clone.php</code>.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const SOURCE_BADGE_STYLE: Record<string, { color: string; background: string }> = {
  collection: { color: 'var(--pc-fg-muted)', background: 'var(--pc-surface-2)' },
  config: { color: 'var(--pc-status-info)', background: 'var(--pc-status-info-bg)' },
  override: { color: 'var(--pc-status-warn)', background: 'var(--pc-status-warn-bg)' },
};

function VariableRow({
  envId,
  v,
}: {
  envId: string;
  v: { name: string; value: string; is_secret: boolean; source: string };
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const setOverride = useEnvironmentsStore((s) => s.setOverride);
  const clearOverride = useEnvironmentsStore((s) => s.clearOverride);

  const display = v.is_secret ? '••••••' : v.value;

  return (
    <tr className="border-b border-line-subtle">
      <td className="px-2 py-1.5 font-mono text-fg text-xs">{v.name}</td>
      <td className="px-2 py-1.5">
        <input
          className="w-full bg-transparent border-0 outline-none px-1 py-1 rounded focus:bg-surface-2 font-mono text-xs text-fg placeholder:text-fg-subtle"
          value={draft ?? display}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={async () => {
            if (draft !== null && draft !== display) {
              await setOverride(envId, v.name, draft);
            }
            setDraft(null);
          }}
        />
      </td>
      <td className="px-2 py-1.5">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
          style={SOURCE_BADGE_STYLE[v.source] ?? SOURCE_BADGE_STYLE.collection}
        >
          {v.source}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center">
        {v.source === 'override' ? (
          <button
            onClick={() => clearOverride(envId, v.name)}
            className="text-fg-subtle hover:text-status-error"
            title="Reset to config default"
          >↺</button>
        ) : null}
      </td>
    </tr>
  );
}
