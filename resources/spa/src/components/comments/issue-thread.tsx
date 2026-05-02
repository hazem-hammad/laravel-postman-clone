import { useEffect } from 'react';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import { sanitizeIssueHtml } from '@/lib/sanitize-html';
import type { LinkedIssue } from '@/api/issues';

export function IssueThread({ issue }: { issue: LinkedIssue }) {
  const ensure = useLinkedIssuesStore((s) => s.ensureThread);
  const refresh = useLinkedIssuesStore((s) => s.refreshThread);

  useEffect(() => {
    if (!issue.thread_html) void ensure(issue.id);
  }, [issue.id]);

  const fetched = Boolean(issue.thread_fetched_at);

  return (
    <div className="border-t border-line-subtle px-3 py-2">
      {issue.thread_html ? (
        <div
          className="text-xs text-fg leading-relaxed [&_a]:text-accent [&_a]:underline [&_pre]:bg-surface [&_pre]:p-2 [&_pre]:rounded"
          dangerouslySetInnerHTML={{ __html: sanitizeIssueHtml(issue.thread_html) }}
        />
      ) : fetched ? (
        <div className="text-fg-subtle text-xs italic">
          No body or replies yet — open on GitHub to add the first comment.
        </div>
      ) : (
        <div className="text-fg-subtle text-xs">Loading thread…</div>
      )}
      <div className="flex items-center gap-3 mt-2 text-[11px] text-fg-subtle">
        <a
          href={issue.issue_html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent"
        >
          Reply on GitHub →
        </a>
        <button onClick={() => refresh(issue.id)} className="hover:text-fg">
          Refresh
        </button>
      </div>
    </div>
  );
}
