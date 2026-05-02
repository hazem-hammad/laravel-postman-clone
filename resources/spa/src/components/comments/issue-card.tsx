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
  const dot = issue.issue_state === 'open' ? 'text-status-success' : 'text-fg-subtle';
  return (
    <div className="border border-line-subtle rounded-md bg-surface-2">
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
      >
        <span className={dot}>●</span>
        <span className="font-medium text-fg flex-1 truncate">
          #{issue.issue_number} {issue.issue_title}
        </span>
        <span className="text-fg-subtle">{issue.comment_count} comment(s)</span>
      </button>
      {open ? <IssueThread issue={issue} /> : null}
    </div>
  );
}
