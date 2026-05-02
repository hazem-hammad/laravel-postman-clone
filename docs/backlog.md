# postman-clone backlog

What's deferred, grouped by milestone. Pulled from the spec's section 12
plus everything explicitly cut from v0.1.

## v0.2 — UX polish

- Monaco editor (lazy-loaded) for request body + response body.
  Two instances per active tab, disposed on tab close. JSON / XML /
  plaintext languages. Theme tokens map to `--pc-primary`.
- `VariableHighlightedInput` component overlaying tokenized
  `{{var}}` spans (green = resolves, red = missing, blue = secret-masked).
  Used in URL bar, key/value tables, and Monaco token provider.
- `/api/preview` integration — show the resolved URL beneath the editable
  raw URL with masked secrets.
- Auth helpers as a first-class section: Bearer, Basic, API Key.
- `'driver' => 'memory'` storage mode for CI smoke tests of the package.
- `php artisan postman-clone:install --with-collection-stub` flag to
  optionally drop a starter `postman.json` next to the consumer's
  `app/Http`.

## v0.3 — Power tools

- **MCP server** for Claude / AI tools. Reuses `RequestExecutor` and
  `CollectionLoader` services behind an MCP transport.
- **`php artisan postman-clone:generate`** — scaffold a Postman v2.1
  collection from `routes/api.php`. Reflects on FormRequest classes for
  body shapes; emits one folder per controller; pre-fills `{{base_url}}`.
- Newman-compatible CLI runner (so the same collection can be smoke-tested
  in CI).
- Codegen the SPA's `types.ts` from a backend-emitted OpenAPI spec.

## Post-v0.x

### Access & multi-user
- Per-user history & env override partitioning.
- Full prod-ready mode with audit log.
- Saved-views / per-user workspace pinning.

### Postman feature parity
- Pre-request scripts & test scripts (JS sandbox).
- Collection runner / batch execution.
- Mock servers.
- Cookie jar / session continuity across requests.
- WebSocket, GraphQL (first-class), gRPC, SSE.
- File-upload bodies > a few MB with chunked streaming.
- OpenAPI import → collection conversion.
- Insomnia import.
- Examples (saved request/response pairs).

### Editing & data
- UI-driven write-back to the collection JSON file (risky; needs round-trip-safe serializer).
- "Promote env override to shared config" button.
- Theme tokens editable from settings drawer.

### Response handling
- Streaming response panel (chunked rendering / SSE).
- Schema validation against OpenAPI spec → "test passed/failed" UX.
- Retry-with-backoff for transient failures.
- Diff view between two runs of the same request.

### Performance
- Virtualized collection-tree for huge collections.
- Response body streaming-to-disk + viewer paging.
- Background warm-up of Monaco workers.
- Visual regression tests for the SPA.
