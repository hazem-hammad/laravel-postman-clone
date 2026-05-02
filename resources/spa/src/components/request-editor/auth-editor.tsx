export function AuthEditor() {
  return (
    <div className="p-3 text-xs text-fg-muted">
      Inline auth helpers (Bearer / Basic / API Key) are on the roadmap. For now, set{' '}
      <code className="px-1.5 py-0.5 bg-surface-2 border border-line-subtle rounded text-fg font-mono">
        Authorization
      </code>{' '}
      manually in the Headers tab.
    </div>
  );
}
