import type { RunResult } from '@/api/types';

export function ResponseBodyView({ result }: { result: RunResult | null }) {
  if (!result) return null;
  // For error responses with no body content, surface that explicitly rather
  // than rendering nothing — the user should see the banner is the whole story.
  if (result.error_kind && !result.body) {
    return (
      <div className="flex-1 p-3 text-xs text-zinc-400">
        No response body. The error is shown in the banner above.
      </div>
    );
  }

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
