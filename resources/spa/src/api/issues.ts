import { request } from './client';

export type LinkedIssue = {
  id: number;
  collection_id: string;
  request_id: string;
  issue_number: number;
  issue_title: string;
  issue_state: 'open' | 'closed' | 'deleted';
  issue_html_url: string;
  assignee_login: string | null;
  comment_count: number;
  thread_html: string | null;
  thread_fetched_at: string | null;
  created_at?: string;
};

export type Counts = Record<string, { open: number; closed: number }>;

export const listIssues = (collectionId: string, requestId?: string) => {
  const qs = new URLSearchParams({ collection_id: collectionId });
  if (requestId) qs.set('request_id', requestId);
  return request<{ data: LinkedIssue[] }>(`/issues?${qs.toString()}`).then((r) => r.data);
};

export const getCounts = (collectionId: string) =>
  request<{ data: Counts }>(
    `/issues/counts?collection_id=${encodeURIComponent(collectionId)}`,
  ).then((r) => r.data);

export const createIssue = (input: {
  collection_id: string;
  request_id: string;
  title: string;
  body: string;
  assignee: string | null;
  idempotency_key: string;
  context: Record<string, unknown>;
}) => request<LinkedIssue>('/issues', { method: 'POST', body: input });

export const getThread = (id: number) => request<LinkedIssue>(`/issues/${id}/thread`);

export const refreshThread = (id: number) =>
  request<LinkedIssue>(`/issues/${id}/refresh`, { method: 'POST' });

export const syncStatus = (ids: number[]) =>
  request<{
    data: Record<
      string,
      {
        state: string;
        title: string;
        comment_count: number;
        assignee_login: string | null;
      }
    >;
  }>('/issues/sync-status', { method: 'POST', body: { linked_issue_ids: ids } }).then(
    (r) => r.data,
  );

export const suggestAssignee = (method: string, url: string) =>
  request<{ suggested: string | null; source: string | null }>(
    `/issues/suggest-assignee?method=${encodeURIComponent(method)}&url=${encodeURIComponent(url)}`,
  );

export const getCollaborators = () =>
  request<{ data: Array<{ login: string; avatar_url: string }> }>(
    '/issues/collaborators',
  ).then((r) => r.data);
