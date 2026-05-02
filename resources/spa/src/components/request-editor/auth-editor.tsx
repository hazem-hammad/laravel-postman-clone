export function AuthEditor() {
  return (
    <div className="p-3 text-sm text-zinc-500">
      Inline auth helpers (Bearer / Basic / API Key) come in Plan 3. For now, set
      <code className="px-1 bg-zinc-100 rounded mx-1">Authorization</code>
      manually in the Headers tab.
    </div>
  );
}
