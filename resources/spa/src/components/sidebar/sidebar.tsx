import { CollectionTree } from './collection-tree';
import { HistoryList } from './history-list';

export function Sidebar() {
  return (
    <aside className="w-72 border-r border-zinc-200 bg-zinc-50 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <section>
          <h2 className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Collections</h2>
          <CollectionTree />
        </section>
        <section className="mt-4">
          <h2 className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">History</h2>
          <HistoryList />
        </section>
      </div>
    </aside>
  );
}
