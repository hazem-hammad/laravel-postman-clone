import type { Tab } from '@/stores/tabs-store';

/**
 * Build a `curl` invocation that mirrors what the backend would actually send,
 * using the tab's *literal* values (so any {{var}} stays as-is — the user can
 * paste this into a terminal where the variable might be exported, or do
 * a quick substitution by hand).
 */
export function buildCurl(tab: Tab): string {
  const lines: string[] = [];
  const method = tab.method.toUpperCase();
  const url = tab.url || '';

  lines.push(`curl -X ${method} ${shellQuote(url)}`);

  for (const h of tab.headers ?? []) {
    if (h.disabled || !h.key) continue;
    lines.push(`  -H ${shellQuote(`${h.key}: ${h.value ?? ''}`)}`);
  }

  if (tab.body !== null && tab.body !== '' && tab.bodyMode) {
    if (tab.bodyMode === 'raw' || tab.bodyMode === 'json') {
      const bodyStr = typeof tab.body === 'string' ? tab.body : JSON.stringify(tab.body);
      lines.push(`  --data-raw ${shellQuote(bodyStr)}`);
    } else if (tab.bodyMode === 'form-urlencoded' || tab.bodyMode === 'x-www-form-urlencoded') {
      const bodyStr = typeof tab.body === 'string' ? tab.body : '';
      lines.push(`  --data ${shellQuote(bodyStr)}`);
    } else if (tab.bodyMode === 'form-data') {
      // form-data is more complex; emit the raw body so the user can adapt it.
      const bodyStr = typeof tab.body === 'string' ? tab.body : JSON.stringify(tab.body);
      lines.push(`  --data ${shellQuote(bodyStr)}`);
    }
  }

  return lines.join(' \\\n');
}

/**
 * POSIX-shell single-quote a value: wrap in single quotes, and escape any
 * embedded single quotes by closing, escaping, and reopening.
 */
function shellQuote(s: string): string {
  if (s === '') return "''";
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
