import { describe, it, expect, beforeEach } from 'vitest';
import { useTabsStore } from './tabs-store';

const reset = () => useTabsStore.setState({ tabs: [], activeId: null });

const baseInput = {
  collectionId: 'c1', requestId: 'r1', name: 'List items',
  method: 'GET', url: 'https://x.test/items',
  headers: [], params: [], bodyMode: null, body: null,
};

describe('tabsStore', () => {
  beforeEach(reset);

  it('opens a new tab and makes it active', () => {
    useTabsStore.getState().openRequestTab(baseInput);
    expect(useTabsStore.getState().tabs).toHaveLength(1);
    expect(useTabsStore.getState().activeId).toBe(useTabsStore.getState().tabs[0].id);
  });

  it('reuses an existing tab when opening the same request', () => {
    const open = useTabsStore.getState().openRequestTab;
    open(baseInput);
    open(baseInput);
    expect(useTabsStore.getState().tabs).toHaveLength(1);
  });

  it('closes a tab and shifts active id', () => {
    const open = useTabsStore.getState().openRequestTab;
    open({ ...baseInput, requestId: 'r1' });
    open({ ...baseInput, requestId: 'r2' });
    const ids = useTabsStore.getState().tabs.map((t) => t.id);
    useTabsStore.getState().closeTab(ids[1]);
    expect(useTabsStore.getState().tabs).toHaveLength(1);
    expect(useTabsStore.getState().activeId).toBe(ids[0]);
  });

  it('updates fields on a tab', () => {
    useTabsStore.getState().openRequestTab(baseInput);
    const id = useTabsStore.getState().tabs[0].id;
    useTabsStore.getState().updateTab(id, { url: 'new-url' });
    expect(useTabsStore.getState().tabs[0].url).toBe('new-url');
    expect(useTabsStore.getState().tabs[0].dirty).toBe(true);
  });
});
