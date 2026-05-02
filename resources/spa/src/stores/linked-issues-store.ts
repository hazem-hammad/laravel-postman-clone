import { create } from 'zustand';
import * as api from '@/api/issues';
import type { LinkedIssue } from '@/api/issues';

const keyOf = (collectionId: string, requestId: string) =>
  `${collectionId}::${requestId}`;

type State = {
  issuesByKey: Record<string, LinkedIssue[]>;
  countsByCollection: Record<string, api.Counts>;

  loadCounts: (collectionId: string) => Promise<void>;
  loadIssuesForRequest: (collectionId: string, requestId: string) => Promise<LinkedIssue[]>;
  createIssue: (input: Parameters<typeof api.createIssue>[0]) => Promise<LinkedIssue>;
  ensureThread: (id: number) => Promise<LinkedIssue>;
  refreshThread: (id: number) => Promise<LinkedIssue>;
  syncStatus: (ids: number[]) => Promise<void>;
};

export const useLinkedIssuesStore = create<State>((set, get) => ({
  issuesByKey: {},
  countsByCollection: {},

  async loadCounts(collectionId) {
    const counts = await api.getCounts(collectionId);
    set({
      countsByCollection: { ...get().countsByCollection, [collectionId]: counts },
    });
  },

  async loadIssuesForRequest(collectionId, requestId) {
    return get().issuesByKey[keyOf(collectionId, requestId)] ?? [];
  },

  async createIssue(input) {
    const issue = await api.createIssue(input);
    const k = keyOf(input.collection_id, input.request_id);
    const list = get().issuesByKey[k] ?? [];
    set({ issuesByKey: { ...get().issuesByKey, [k]: [issue, ...list] } });
    return issue;
  },

  async ensureThread(id) {
    const r = await api.getThread(id);
    return updateIssueInState(get, set, r);
  },

  async refreshThread(id) {
    const r = await api.refreshThread(id);
    return updateIssueInState(get, set, r);
  },

  async syncStatus(ids) {
    if (ids.length === 0) return;
    const data = await api.syncStatus(ids);
    const next = { ...get().issuesByKey };
    for (const list of Object.values(next)) {
      for (let i = 0; i < list.length; i++) {
        const upd = data[String(list[i].id)];
        if (upd) {
          list[i] = {
            ...list[i],
            issue_state: upd.state as LinkedIssue['issue_state'],
            issue_title: upd.title,
            comment_count: upd.comment_count,
            assignee_login: upd.assignee_login,
          };
        }
      }
    }
    set({ issuesByKey: next });
  },
}));

function updateIssueInState(
  get: () => State,
  set: (partial: Partial<State>) => void,
  updated: LinkedIssue,
): LinkedIssue {
  const k = keyOf(updated.collection_id, updated.request_id);
  const list = (get().issuesByKey[k] ?? []).map((i) =>
    i.id === updated.id ? updated : i,
  );
  if (!list.find((i) => i.id === updated.id)) list.unshift(updated);
  set({ issuesByKey: { ...get().issuesByKey, [k]: list } });
  return updated;
}
