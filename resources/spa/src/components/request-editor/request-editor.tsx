import { useTabsStore } from '@/stores/tabs-store';
import type { WorkspaceLayout } from '@/stores/ui-store';
import { rebuildUrlWithParams } from '@/lib/url-params-sync';
import { RequestSubTabs } from './request-sub-tabs';
import { KeyValueTable } from './key-value-table';
import { BodyEditor } from './body-editor';
import { AuthEditor } from './auth-editor';

/**
 * The request DETAILS area: sub-tabs + currently-active sub-tab content
 * (Params / Headers / Body / Auth). The URL bar lives at the workspace
 * level above this — that way the URL stays full-width regardless of
 * whether the workspace is in vertical or horizontal split.
 */
export function RequestEditor({
  tabId,
  layout = 'vertical',
}: {
  tabId: string;
  layout?: WorkspaceLayout;
}) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  if (!tab) return null;
  const sub = tab.subTab;

  const sectionClass =
    layout === 'horizontal'
      ? 'border-r border-line-subtle flex flex-col bg-app w-1/2 min-w-[320px]'
      : 'border-b border-line-subtle flex flex-col bg-app';
  const sectionStyle: React.CSSProperties =
    layout === 'horizontal' ? {} : { minHeight: '40%' };

  return (
    <section className={sectionClass} style={sectionStyle}>
      <RequestSubTabs tabId={tabId} />
      <div className="flex-1 overflow-auto">
        {sub === 'params' && (
          <KeyValueTable
            rows={tab.params}
            onChange={(params) =>
              update(tab.id, { params, url: rebuildUrlWithParams(tab.url, params) })
            }
            placeholder="Param"
          />
        )}
        {sub === 'headers' && (
          <KeyValueTable
            rows={tab.headers}
            onChange={(headers) => update(tab.id, { headers })}
            placeholder="Header"
          />
        )}
        {sub === 'body' && <BodyEditor tabId={tab.id} />}
        {sub === 'auth' && <AuthEditor />}
      </div>
    </section>
  );
}
