import type { RunResult } from '@/api/types';

export function ResponseBodyView({ result }: { result: RunResult | null }) {
  if (!result) return null;
  if (result.error_kind) return null;

  const body = result.body ?? '';
  let pretty = body;
  try {
    pretty = JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    // not JSON; show raw
  }

  return (
    <pre className="flex-1 overflow-auto p-3 text-xs font-mono bg-zinc-50 whitespace-pre">
      {pretty}
    </pre>
  );
}
