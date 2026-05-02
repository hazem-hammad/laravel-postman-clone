import { useTabsStore } from '@/stores/tabs-store';
import { VariableHighlightedInput } from '@/components/variable-highlighted-input';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function MethodUrlBar({ tabId, onSend }: { tabId: string; onSend: () => void }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  if (!tab) return null;

  return (
    <div className="flex items-center gap-2 p-3 border-b border-zinc-200">
      <select
        value={tab.method}
        onChange={(e) => update(tabId, { method: e.target.value })}
        className="border border-zinc-300 rounded px-2 py-1.5 text-sm font-medium"
      >
        {METHODS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <VariableHighlightedInput
        value={tab.url}
        onChange={(next) => update(tabId, { url: next })}
        placeholder="https://api.example.com/path or {{base_url}}/path"
        className="flex-1 border border-zinc-300 rounded"
      />
      <button
        onClick={onSend}
        disabled={tab.sending}
        className="px-4 py-1.5 rounded text-sm font-medium bg-primary text-primary-text disabled:opacity-50"
      >
        {tab.sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
