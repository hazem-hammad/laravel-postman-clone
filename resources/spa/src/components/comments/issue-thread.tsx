import { useEffect, useMemo } from 'react';
import { useLinkedIssuesStore } from '@/stores/linked-issues-store';
import { sanitizeIssueHtml } from '@/lib/sanitize-html';
import type { LinkedIssue } from '@/api/issues';

export function IssueThread({ issue }: { issue: LinkedIssue }) {
  const ensure = useLinkedIssuesStore((s) => s.ensureThread);
  const refresh = useLinkedIssuesStore((s) => s.refreshThread);

  useEffect(() => {
    if (!issue.thread_html) void ensure(issue.id);
  }, [issue.id]);

  const html = useMemo(
    () => (issue.thread_html ? humanizeTimes(sanitizeIssueHtml(issue.thread_html)) : ''),
    [issue.thread_html],
  );
  const fetched = Boolean(issue.thread_fetched_at);

  return (
    <div className="border-t border-line-subtle bg-surface">
      <div className="px-4 py-3">
        {html ? (
          <div className="pmc-thread" dangerouslySetInnerHTML={{ __html: html }} />
        ) : fetched ? (
          <div className="text-fg-subtle text-xs italic py-2">
            No body or replies yet — open on GitHub to add the first comment.
          </div>
        ) : (
          <div className="text-fg-subtle text-xs py-2">Loading thread…</div>
        )}
      </div>
      <footer className="flex items-center gap-3 px-4 py-2 border-t border-line-subtle text-[11px] bg-surface-2">
        <a
          href={issue.issue_html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-medium"
        >
          ↗ Reply on GitHub
        </a>
        <button
          onClick={() => refresh(issue.id)}
          className="text-fg-muted hover:text-fg ml-auto"
        >
          ↻ Refresh
        </button>
      </footer>
    </div>
  );
}

/**
 * Replace the ISO timestamps the backend wrote into <time datetime="…"> with a
 * human-readable relative form ("3h ago", "yesterday"). Done client-side so the
 * cached HTML stays locale-agnostic and the relative text always reads correct.
 */
function humanizeTimes(html: string): string {
  return html.replace(
    /<time([^>]*?)datetime="([^"]+)"([^>]*)>([^<]*)<\/time>/g,
    (_, before, iso, after) => {
      const rel = relativeTime(iso);
      return `<time${before}datetime="${iso}"${after}>${rel}</time>`;
    },
  );
}

function relativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  const diffSec = Math.round((Date.now() - ts) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'just now';
  if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
  if (abs < 86400 * 7) return `${Math.round(abs / 86400)}d ago`;
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
