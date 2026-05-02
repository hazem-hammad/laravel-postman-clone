import type { RequestNode, TreeNode } from '@/api/types';

export type FoundRequest = { request: RequestNode; folderPath: string[] };

/**
 * Walk a parsed Postman tree, returning the first request matching `id`
 * along with the folder-id path leading to it (used for auto-expanding
 * the sidebar when the request is reached via deep link).
 */
export function findRequestPath(
  items: TreeNode[],
  requestId: string,
  path: string[] = [],
): FoundRequest | null {
  for (const item of items) {
    if (item.type === 'request' && item.id === requestId) {
      return { request: item, folderPath: path };
    }
    if (item.type === 'folder') {
      const found = findRequestPath(item.items, requestId, [...path, item.id]);
      if (found) return found;
    }
  }
  return null;
}
