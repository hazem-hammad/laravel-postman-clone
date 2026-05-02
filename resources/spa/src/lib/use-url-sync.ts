import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCollectionsStore } from '@/stores/collections-store';
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore } from '@/stores/ui-store';
import type { FolderNode, RequestNode, TreeNode } from '@/api/types';

/**
 * Two-way binding between the active tab and the URL.
 *
 * URL → store: when the route includes /collections/:c/requests/:r, ensure
 * the collection is loaded, find the request in its tree, and open/focus
 * the matching tab. Also auto-expands the path of folders containing the
 * request so the sidebar isn't collapsed on a deep link.
 *
 * Store → URL: when the active tab id changes (or its identity), push a
 * matching URL via navigate({ replace: true }) so the back button doesn't
 * accumulate one history entry per tab switch.
 */
export function useUrlSync() {
  const params = useParams();
  const navigate = useNavigate();
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const openRequestTab = useTabsStore((s) => s.openRequestTab);
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const setExpanded = useUiStore((s) => s.setExpanded);

  const lastSyncedRef = useRef<{ collectionId: string | null; requestId: string | null }>({
    collectionId: null,
    requestId: null,
  });

  // URL → store
  useEffect(() => {
    const collectionId = params.collectionId ? decodeURIComponent(params.collectionId) : null;
    const requestId = params.requestId ? decodeURIComponent(params.requestId) : null;
    if (!collectionId || !requestId) return;
    if (
      lastSyncedRef.current.collectionId === collectionId &&
      lastSyncedRef.current.requestId === requestId
    ) {
      return;
    }
    lastSyncedRef.current = { collectionId, requestId };

    let cancelled = false;
    (async () => {
      const detail = await ensureLoaded(collectionId);
      if (cancelled || !detail) return;
      const found = findRequestPath(detail.items, requestId);
      if (!found) return;
      // expand collection + every folder on the path so the tree shows the request
      setExpanded(collectionId, true);
      for (const folderId of found.folderPath) {
        setExpanded(`${collectionId}::folder::${folderId}`, true);
      }
      openRequestTab({
        collectionId,
        requestId,
        name: found.request.name,
        method: found.request.method,
        url: found.request.url,
        headers: found.request.headers,
        params: found.request.params,
        bodyMode: found.request.body_mode,
        body: found.request.body,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [params.collectionId, params.requestId, ensureLoaded, openRequestTab, setExpanded]);

  // Store → URL
  useEffect(() => {
    const active = tabs.find((t) => t.id === activeId);
    const target =
      active && active.collectionId && active.requestId
        ? `/collections/${encodeURIComponent(active.collectionId)}/requests/${encodeURIComponent(active.requestId)}`
        : '/';

    const current = window.location.pathname.replace(/^\/[^/]+/, '') || '/';
    if (current !== target) {
      navigate(target, { replace: true });
      lastSyncedRef.current = active && active.collectionId && active.requestId
        ? { collectionId: active.collectionId, requestId: active.requestId }
        : { collectionId: null, requestId: null };
    }
  }, [activeId, tabs, navigate]);
}

type FoundRequest = { request: RequestNode; folderPath: string[] };

function findRequestPath(items: TreeNode[], requestId: string, path: string[] = []): FoundRequest | null {
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
