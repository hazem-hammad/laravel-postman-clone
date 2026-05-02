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
      <div className="fixed inset-0 bg-black/30 z-40" onClick={close} aria-hidden />
      <aside className="fixed right-0 top-0 bottom-0 w-[28rem] bg-white z-50 border-l border-zinc-200 flex flex-col shadow-xl">
        <header className="px-4 h-12 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Environments</h2>
          <button onClick={close} className="text-zinc-500 hover:text-zinc-900" aria-label="Close panel">×</button>
        </header>
        {env === null ? (
          <div className="p-4 text-sm text-zinc-500">No environments configured.</div>
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
      <div className="text-xs text-zinc-500">
        Editing <span className="font-mono text-zinc-800">{env.id}</span>. Edits are stored in
        <code className="px-1 mx-1 bg-zinc-100 rounded">storage/postman-clone/environments.local.json</code>
        (gitignored). The PHP config file is never written to.
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-zinc-500 text-left">
          <tr>
            <th className="px-2 py-1">Name</th>
            <th className="px-2 py-1">Value</th>
            <th className="px-2 py-1 w-24">Source</th>
            <th className="px-2 py-1 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {env.variables.map((v) => (
            <VariableRow key={v.name} envId={env.id} v={v} />
          ))}
          {env.variables.length === 0 ? (
            <tr><td colSpan={4} className="text-center text-xs text-zinc-400 py-4">
              No variables yet. Define some in <code>config/postman-clone.php</code>.
            </td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const SOURCE_BADGE: Record<string, string> = {
  collection: 'bg-zinc-100 text-zinc-700',
  config: 'bg-blue-100 text-blue-800',
  override: 'bg-amber-100 text-amber-800',
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
    <tr className="border-t border-zinc-100">
      <td className="px-2 py-1 font-mono text-zinc-800">{v.name}</td>
      <td className="px-2 py-1">
        <input
          className="w-full bg-transparent border-0 outline-none px-1 py-0.5 focus:bg-zinc-50 font-mono text-xs"
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
      <td className="px-2 py-1">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SOURCE_BADGE[v.source] ?? 'bg-zinc-100 text-zinc-700'}`}>
          {v.source}
        </span>
      </td>
      <td className="px-2 py-1">
        {v.source === 'override' ? (
          <button
            onClick={() => clearOverride(envId, v.name)}
            className="text-xs text-zinc-400 hover:text-red-600"
            title="Reset to config default"
          >↺</button>
        ) : null}
      </td>
    </tr>
  );
}
