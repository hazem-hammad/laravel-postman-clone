import type { KeyValue } from '@/api/types';

/**
 * Rebuild a URL by replacing its query string with the active params.
 *
 * - Active params (not disabled, non-empty key) are joined as ?k=v&k=v.
 * - Disabled params don't appear in the URL but stay in the table state
 *   (so toggling them back on restores them in place).
 * - Values are inserted verbatim — no urlencoding here. Matches Postman's
 *   display (the executor handles encoding when actually firing the
 *   request). Lets users see {{var}} placeholders without %7B%7B noise.
 */
export function rebuildUrlWithParams(url: string, params: KeyValue[]): string {
  const idx = url.indexOf('?');
  const base = idx === -1 ? url : url.slice(0, idx);
  const active = params.filter((p) => !p.disabled && p.key);
  if (active.length === 0) return base;
  const qs = active.map((p) => `${p.key}=${p.value}`).join('&');
  return `${base}?${qs}`;
}

/**
 * Parse the query string from a URL into KeyValue rows.
 *
 * - Disabled params from the existing table are preserved as a tail; the
 *   user can keep them around without seeing them in the URL.
 * - Empty pairs (`?&` etc.) and bare keys (`?foo`) are tolerated:
 *     `?foo` → { key: 'foo', value: '', disabled: false }
 * - No url-decoding (mirrors rebuildUrlWithParams' no-encode policy).
 */
export function syncParamsFromUrl(url: string, existingParams: KeyValue[]): KeyValue[] {
  const disabled = existingParams.filter((p) => p.disabled);
  const idx = url.indexOf('?');
  if (idx === -1) return disabled;

  const qs = url.slice(idx + 1);
  const out: KeyValue[] = [];
  if (qs) {
    for (const pair of qs.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const key = eq === -1 ? pair : pair.slice(0, eq);
      const value = eq === -1 ? '' : pair.slice(eq + 1);
      if (key) out.push({ key, value, disabled: false });
    }
  }
  return [...out, ...disabled];
}
