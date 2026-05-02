import { getRuntime } from '@/lib/runtime';

export function App() {
  const { theme } = getRuntime();
  return (
    <div className="h-full flex items-center justify-center text-zinc-700">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">{theme.app_name}</h1>
        <p className="text-sm text-zinc-500 mt-2">SPA scaffold — Phase 0 complete.</p>
      </div>
    </div>
  );
}
