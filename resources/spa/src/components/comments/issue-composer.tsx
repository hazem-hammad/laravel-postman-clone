import { useEffect, useState } from 'react';
import { useTabsStore } from '@/stores/tabs-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useMetaStore } from '@/stores/meta-store';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import * as api from '@/api/issues';

export function IssueComposer({
  tabId,
  onClose,
}: {
  tabId: string;
  onClose: () => void;
}) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const envId = useEnvironmentsStore((s) => s.activeId);
  const branch = useMetaStore((s) => s.gitBranch);
  const create = useLinkedIssuesStore((s) => s.createIssue);

  const [title, setTitle] = useState(`Issue with ${tab?.name ?? 'request'}`);
  const [body, setBody] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ login: string; source: string } | null>(
    null,
  );
  const [collaborators, setCollaborators] = useState<Array<{ login: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tab) return;
    api
      .suggestAssignee(tab.method, tab.url)
      .then((r) => {
        if (r.suggested) {
          setSuggestion({ login: r.suggested, source: r.source ?? '' });
          setAssignee(r.suggested);
        }
      })
      .catch(() => undefined);
    api
      .getCollaborators()
      .then((rows) => setCollaborators(rows))
      .catch(() => undefined);
  }, [tab?.id]);

  if (!tab) return null;

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await create({
        collection_id: tab.collectionId ?? '',
        request_id: tab.requestId ?? '',
        title,
        body,
        assignee,
        idempotency_key: crypto.randomUUID(),
        context: {
          collection_name: '',
          request_path: tab.name,
          method: tab.method,
          url_raw: tab.url,
          url_resolved: tab.url,
          env_id: envId,
          branch,
          last_run: tab.lastResult
            ? {
                status: tab.lastResult.status,
                error_kind: tab.lastResult.error_kind,
                message: tab.lastResult.error_message,
                timing_ms: tab.lastResult.timing_ms,
              }
            : null,
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-line rounded-md p-3 bg-surface flex flex-col gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Issue title"
        className="bg-surface-2 border border-line-subtle rounded px-2 py-1.5 text-sm text-fg outline-none focus:border-line"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Describe the issue. Markdown supported."
        rows={6}
        className="bg-surface-2 border border-line-subtle rounded px-2 py-1.5 text-xs font-mono text-fg outline-none focus:border-line resize-y"
      />
      <div className="flex items-center gap-2 text-xs">
        <label className="text-fg-muted">Assignee:</label>
        <select
          value={assignee ?? ''}
          onChange={(e) => setAssignee(e.target.value || null)}
          className="bg-surface-2 border border-line-subtle rounded px-2 py-1 text-xs text-fg"
        >
          <option value="">— none —</option>
          {collaborators.map((c) => (
            <option key={c.login} value={c.login}>
              @{c.login}
            </option>
          ))}
        </select>
        {suggestion ? (
          <span className="text-[10px] text-fg-subtle">
            (suggested @{suggestion.login} · {suggestion.source})
          </span>
        ) : null}
      </div>
      {error ? <div className="text-[11px] text-status-error">{error}</div> : null}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={submit}
          disabled={submitting || !title.trim() || !body.trim()}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent hover:bg-accent-hover text-accent-text disabled:opacity-50"
        >
          {submitting ? 'Filing…' : 'File issue'}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-md text-xs font-medium border border-line-subtle bg-surface-2 hover:bg-surface-hover text-fg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
