import { useState } from 'react';
import type { LinkedIssue } from '@/api/issues';
import { IssueCard } from './issue-card';

export function IssueThreadList({ issues }: { issues: LinkedIssue[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  if (issues.length === 0) {
    return <div className="text-xs text-fg-subtle">No issues yet for this request.</div>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {issues.map((i) => (
        <li key={i.id}>
          <IssueCard
            issue={i}
            open={openId === i.id}
            onToggle={() => setOpenId(openId === i.id ? null : i.id)}
          />
        </li>
      ))}
    </ul>
  );
}
