export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-app">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-surface flex items-center justify-center text-fg-subtle">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-1-8.5a3 3 0 0 1 6 0c0 1.27-.797 1.967-1.514 2.534l-.092.072c-.394.305-.622.504-.706.838a.75.75 0 1 1-1.456-.367c.213-.847.762-1.275 1.184-1.604.064-.05.13-.1.193-.149.516-.405.891-.733.891-1.324a1.5 1.5 0 0 0-3 0 .75.75 0 0 1-1.5 0zM13 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
            />
          </svg>
        </div>
        <h2 className="text-fg text-sm font-semibold">Select a request to start</h2>
        <p className="text-fg-subtle text-xs mt-1.5 max-w-sm">
          Pick a request from the sidebar — or paste a deep link in the URL bar — to open a tab.
        </p>
      </div>
    </div>
  );
}
