import type { LinkedIssue } from '@/api/issues';
import { IssueThread } from './issue-thread';

export function IssueCard({
  issue,
  open,
  onToggle,
}: {
  issue: LinkedIssue;
  open: boolean;
  onToggle: () => void;
}) {
  const state = issue.issue_state;
  const stateStyle =
    state === 'open'
      ? 'bg-status-success/15 text-status-success border-status-success/40'
      : state === 'closed'
        ? 'bg-fg-subtle/15 text-fg-muted border-fg-subtle/40'
        : 'bg-status-error/15 text-status-error border-status-error/40';
  const stateLabel = state === 'deleted' ? 'Deleted' : state === 'open' ? 'Open' : 'Closed';

  return (
    <div className="border border-line-subtle rounded-md bg-surface-2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-surface-hover transition-colors"
      >
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${stateStyle} flex items-center gap-1 shrink-0`}
        >
          <Dot />
          {stateLabel}
        </span>
        <span className="text-fg-subtle text-xs font-mono shrink-0">
          #{issue.issue_number}
        </span>
        <span className="font-medium text-fg text-xs flex-1 truncate">
          {issue.issue_title}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-fg-subtle shrink-0">
          {issue.assignee_login ? (
            <span
              className="px-1.5 py-0.5 rounded-full bg-surface text-fg-muted border border-line-subtle"
              title={`Assigned to @${issue.assignee_login}`}
            >
              @{issue.assignee_login}
            </span>
          ) : null}
          <span className="flex items-center gap-1" title={`${issue.comment_count} comment(s)`}>
            <CommentIcon />
            {issue.comment_count}
          </span>
          <Caret open={open} />
        </div>
      </button>
      {open ? <IssueThread issue={issue} /> : null}
    </div>
  );
}

function Dot() {
  return (
    <svg viewBox="0 0 8 8" width="6" height="6" aria-hidden>
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
      <path
        fill="currentColor"
        d="M1 2.75A2.75 2.75 0 0 1 3.75 0h8.5A2.75 2.75 0 0 1 15 2.75v6.5A2.75 2.75 0 0 1 12.25 12H7.81l-3.13 3.13a.75.75 0 0 1-1.28-.53V12h-.65A2.75 2.75 0 0 1 1 9.25v-6.5z"
      />
    </svg>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="11"
      height="11"
      aria-hidden
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path
        fill="currentColor"
        d="M3.22 5.22a.75.75 0 0 1 1.06 0L8 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.28a.75.75 0 0 1 0-1.06z"
      />
    </svg>
  );
}
