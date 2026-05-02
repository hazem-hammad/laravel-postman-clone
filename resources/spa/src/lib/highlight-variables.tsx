import type { ReactNode } from 'react';
import { useEnvironmentsStore } from '@/stores/environments-store';

const VAR_RE = /\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/g;

export type VarToken =
  | { type: 'text'; text: string }
  | { type: 'var'; text: string; name: string; resolved: boolean; value: string; isSecret: boolean };

export type VarMap = Map<string, { value: string; isSecret: boolean; source: string }>;

/**
 * Read the active environment's variables as a flat map. Falls back to an
 * empty map when no environment is active. Used by VariableHighlightedInput
 * to colorize {{var}} occurrences and to populate the hover popover.
 */
export function useActiveVariables(): VarMap {
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeId = useEnvironmentsStore((s) => s.activeId);
  const env = environments.find((e) => e.id === activeId);
  const map: VarMap = new Map();
  if (env) {
    for (const v of env.variables) {
      map.set(v.name, { value: v.value, isSecret: v.is_secret, source: v.source });
    }
  }
  return map;
}

export function tokenizeWithVariables(input: string, vars: VarMap): VarToken[] {
  const tokens: VarToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  VAR_RE.lastIndex = 0;
  while ((m = VAR_RE.exec(input)) !== null) {
    if (m.index > last) {
      tokens.push({ type: 'text', text: input.slice(last, m.index) });
    }
    const name = m[1];
    const hit = vars.get(name);
    tokens.push({
      type: 'var',
      text: m[0],
      name,
      resolved: !!hit,
      value: hit?.value ?? '',
      isSecret: !!hit?.isSecret,
    });
    last = VAR_RE.lastIndex;
  }
  if (last < input.length) {
    tokens.push({ type: 'text', text: input.slice(last) });
  }
  return tokens;
}

/**
 * Render a tokenized string as React fragments. Vars get a colored class:
 *   - resolved → emerald (green)
 *   - unresolved → red
 *   - secret-resolved → blue (still resolved, but value is masked)
 */
export function renderTokens(tokens: VarToken[]): ReactNode {
  return tokens.map((t, i) => {
    if (t.type === 'text') {
      return <span key={i} className="text-fg">{t.text}</span>;
    }
    const styleVar = !t.resolved
      ? { color: 'var(--pc-var-missing-fg)', background: 'var(--pc-var-missing-bg)' }
      : t.isSecret
        ? { color: 'var(--pc-var-secret-fg)', background: 'var(--pc-var-secret-bg)' }
        : { color: 'var(--pc-var-resolved-fg)', background: 'var(--pc-var-resolved-bg)' };
    return (
      <span key={i} className="rounded px-0.5" style={styleVar}>
        {t.text}
      </span>
    );
  });
}

/**
 * List of unique variable names in the input, with their resolution state.
 * Used by the hover popover.
 */
export function listVarsInInput(input: string, vars: VarMap): VarToken[] {
  const seen = new Set<string>();
  const out: VarToken[] = [];
  for (const tok of tokenizeWithVariables(input, vars)) {
    if (tok.type === 'var' && !seen.has(tok.name)) {
      seen.add(tok.name);
      out.push(tok);
    }
  }
  return out;
}
