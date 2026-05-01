# Postman Clone — Design Spec

- **Date:** 2026-05-02
- **Status:** Approved (brainstorming complete; pending implementation plan)
- **Owner:** Hazem Hamaad
- **Composer package (placeholder):** `hazem-hammad/postman-clone`
- **PHP namespace:** `HazemHammad\PostmanClone`
- **Repo:** standalone — `postman-clone/` directory at the root of the Ticket-scape working tree, with its own `.git`. Will be pushed to `github.com/hazem-hammad/postman-clone` once ready for OSS publication.

---

## 1. Goal

Build a free, open-source Laravel package that mounts a Postman-like UI into any
Laravel application. A developer who installs the package can:

- Browse Postman v2.1 collections sourced from project paths (or uploaded via UI).
- Edit requests in a familiar three-pane workspace (sidebar, request editor, response viewer).
- Send requests through the host application's runtime (server-side execution via Guzzle).
- Inspect responses (status, headers, body, timing, size) with syntax highlighting.
- Switch between environments defined in the package config; override values per-developer from the UI.
- See history of recent runs and replay them.

The package is designed to be tested against the current Ticket-scape backend
but is **not coupled** to it — it ships as an installable composer package for
any Laravel project.

## 2. Non-goals (v1)

These are explicitly deferred to the package's `docs/backlog.md`:

- Multi-user partitioning of history & env overrides.
- Pre-request scripts / test scripts (JS sandbox).
- Collection runner / batch execution / Newman-style CLI.
- Mock servers, monitors, documentation generation.
- WebSocket, GraphQL (first-class mode), gRPC, SSE.
- File upload bodies > a few MB; cookie jar / session continuity across requests.
- OpenAPI / Insomnia import.
- UI-driven write-back to the source collection JSON file.
- MCP server for Claude/AI tools (designed for; not built in v1).
- `php artisan postman-clone:generate` CLI to scaffold a v2.1 collection from `routes/api.php`.

## 3. Runtime model

### 3.1 Where it runs

v1 ships with `enabled_environments = ['local']` by default. In production, the
service provider boots but registers no routes — making accidental staging/prod
exposure impossible without an explicit config opt-in.

### 3.2 Access control (config-flippable)

```php
// config/postman-clone.php
'access' => [
    'enabled_environments' => ['local'],   // gate by Laravel env; 404 outside this list
    'middleware'           => [],          // append 'auth', 'auth:sanctum', custom
    'gate'                 => null,        // optional Gate name; 403 if denied
],
```

Behavior of the `EnsurePackageEnabled` middleware (applied to every package route):

1. **Env check.** If `app()->environment()` is not in `enabled_environments`, abort 404 (intentionally not 403 — we don't leak that the package exists).
2. **Auth pass-through.** Any middleware in `access.middleware` is applied at route registration so `'auth'` triggers Laravel's normal redirect-to-login flow.
3. **Gate check.** If `access.gate` is set and `Gate::denies($gate)` for the current user, abort 403.

The default keeps v1 strictly local. The "team-accessible on staging" recipe is a config flip:

```php
'enabled_environments' => ['local', 'staging'],
'middleware'           => ['web', 'auth'],
'gate'                 => 'viewPostmanClone',
```

### 3.3 Execution model — server-side via Guzzle

All HTTP calls happen on the Laravel server, not the browser. Three reasons:

1. The package's primary use case is testing the Laravel app it's installed into. Server-side execution can hit `127.0.0.1`, internal microservices, and bypass CORS entirely.
2. Secrets (env-resolved tokens) never leave the server.
3. Mirrors how Newman / CI-mode Postman runs work — same mental model.

### 3.4 Response handling caps

Single-shot JSON responses everywhere. Response bodies are buffered up to a
configurable cap (default **5 MB**) and returned in one response. Larger bodies
are truncated; the UI shows a banner. Streaming response panels go to backlog.

## 4. Architecture overview

```
┌──────────────────── Browser (React SPA) ────────────────────┐
│ React 18 + TypeScript + Vite + Tailwind, pre-built into     │
│ resources/dist/. Mounted at /postman. Talks to              │
│ /postman/api/* via fetch (same-origin, no CORS).            │
│ Owns: tabs, request editor, response viewer, history list.  │
└─────────────────────────────────────────────────────────────┘
                            │ JSON over fetch
                            ▼
┌──────────────────── Laravel package ────────────────────────┐
│ ServiceProvider                                              │
│  ├─ Routes (gated by env)         ─ /postman + /postman/api │
│  ├─ Asset publisher                ─ vendor:publish for dist│
│  ├─ Migration loader               ─ scoped to package conn │
│  └─ Storage connection registrar                             │
│                                                              │
│ Controllers                                                  │
│  ├─ AppController                  ─ serves the Blade shell │
│  ├─ CollectionsController          ─ list / show / upload   │
│  ├─ EnvironmentsController         ─ read / edit overrides  │
│  ├─ RequestRunnerController        ─ execute & return result│
│  └─ HistoryController              ─ list / show / delete   │
│                                                              │
│ Services (framework-light core; reusable from MCP later)    │
│  ├─ Collections/CollectionLoader                             │
│  ├─ Collections/CollectionRegistry                           │
│  ├─ Collections/PostmanV21Parser                             │
│  ├─ Environments/EnvironmentResolver                         │
│  ├─ Environments/EnvironmentWriter                           │
│  ├─ Execution/VariableSubstitutor                            │
│  ├─ Execution/RequestExecutor      (Guzzle wrapper)          │
│  └─ History/HistoryRecorder                                  │
│                                                              │
│ Eloquent (one logical connection: 'postman_clone_storage')  │
│  └─ Run                                                      │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Why a pre-built SPA

Telescope/Horizon/Pulse pattern. Consumer installs the composer package and
gets a working UI without running `npm install`, configuring a build, or adding
JS dependencies to their app. Only `resources/dist/` ships on Packagist;
`resources/spa/` is dev-only and excluded via `.gitattributes`.

### 4.2 Why server-side execution

See 3.3.

### 4.3 Why one connection with two storage drivers

The package owns its persistence. Default driver = self-contained SQLite at
`storage/postman-clone/history.sqlite` — zero coupling to the consumer's
database, easy to wipe, doesn't pollute their migrations. A `database` driver
lets consumers route history into their main connection (with a
`postman_clone_` table prefix) if they want Eloquent-queryable access. Both
modes use the **same** Eloquent models and migrations against a logical
connection (`postman_clone_storage`); only the boot wiring differs.

A backlog `'driver' => 'memory'` mode is reserved for CI smoke tests of the
package itself.

## 5. Configuration

The single `config/postman-clone.php` file consumers publish via the install command:

```php
return [
    'route' => [
        'prefix' => 'postman',         // mount point; final URL: /postman
    ],

    'access' => [
        'enabled_environments' => ['local'],
        'middleware'           => [],
        'gate'                 => null,
    ],

    'theme' => [
        'primary_color'   => '#0B5FFF',     // injected as --pc-primary CSS var
        'primary_text'    => '#FFFFFF',
        'app_name'        => 'Postman Clone',
        'logo_url'        => null,
        'favicon_url'     => null,
        'default_mode'    => 'system',      // 'light' | 'dark' | 'system'
    ],

    'storage' => [
        'driver'       => env('POSTMAN_CLONE_STORAGE', 'sqlite'),  // 'sqlite' | 'database'
        'connection'   => null,                                     // when 'database': null = default
        'sqlite' => [
            'path' => storage_path('postman-clone/history.sqlite'),
        ],
        'table_prefix' => 'postman_clone_',
    ],

    'collections' => [
        // Array of absolute paths to Postman v2.1 JSON collections.
        // Re-read from disk on each /api/collections fetch — no file watcher, no cache.
        // Example:
        // base_path('docs/postman/ticketscape.postman_collection.json'),
    ],

    'environments' => [
        // 'local' => [
        //     'base_url' => 'http://localhost:8000/api/v1',
        //     'token'    => env('POSTMAN_CLONE_LOCAL_TOKEN'),
        // ],
    ],
    'default_environment' => null,

    'execution' => [
        'timeout_seconds'       => 30,
        'response_body_cap_mb'  => 5,
        'follow_redirects'      => true,
        'max_redirects'         => 5,
        'verify_tls'            => true,
    ],

    'history' => [
        'retain_days'     => 14,
        'retain_max_rows' => 5000,
    ],
];
```

Variable substitution uses `{{name}}` syntax, matching Postman. Precedence:
collection variables → environment variables (config) → environment overrides
(`storage/postman-clone/environments.local.json`). Recursive resolution capped
at 3 hops.

Secret values (anything sourced via `env()` in the config) never leave the
server — they're substituted into the outgoing Guzzle request and masked
(`••••`) in any preview, history record, or UI display.

## 6. Data flow scenarios

### 6.1 Boot

```
GET /postman → AppController@show → app.blade.php → SPA mounts
SPA → GET /postman/api/bootstrap
  → returns { collections: [...meta], environments: [...], active_environment, history_count }
```

### 6.2 Open a request from the tree

```
SPA fetches collection if not yet cached:
GET /postman/api/collections/{id}
  → CollectionRegistry::find(id) → CollectionLoader::load(path) (re-reads JSON)
  → PostmanV21Parser → DTO tree → JSON

SPA opens a tab, populates the request editor from the DTO.
Subsequent edits are pure client state (Zustand + localStorage); no server traffic.
```

### 6.3 Send a request

```
SPA → POST /postman/api/runs with the assembled payload
  → RequestRunnerController validates payload
  → EnvironmentResolver::resolve(environment_id) → merged vars (config + override)
  → VariableSubstitutor::apply(payload, vars) → resolved request
  → RequestExecutor::execute(resolved) → Guzzle → ResultDto
       ├─ HTTP success/error → status, headers, body, timing, size
       ├─ network/dns/tls/timeout → ResultDto with error_kind, no response_status
       └─ body > cap → truncated body + flag
  → HistoryRecorder::record(payload-with-secrets-masked, result) → Run row
  → response: { result, run_id }
```

### 6.4 Edit an environment variable

```
SPA → PUT /postman/api/environments/{env_id}/variables/{var_name} { value }
  → EnvironmentsController validates
  → EnvironmentWriter::setOverride(...)
       → reads/creates storage/postman-clone/environments.local.json under flock
       → merges in the new override
       → atomic write (temp file + rename)
  → returns { variable: { name, effective_value, source: 'local_override' } }
```

The PHP config file is **never** mutated by the UI. Edits are an overlay
written to the gitignored JSON file, merged at resolution time. The UI shows a
"source" badge (`config` / `local_override`) per row.

### 6.5 Replay from history

```
SPA → GET /postman/api/runs/{id} → full Run row → opens read-only tab
User clicks Send → re-execute via the standard run flow
User clicks "Open as new request" → tab becomes editable
```

### 6.6 Variable substitution preview

The URL bar shows a faded-ghost preview of the resolved URL beneath the
editable raw URL. The preview comes from a lightweight
`POST /postman/api/preview` endpoint that runs the substitutor and returns
masked-secret output. Browser never sees raw secret values.

## 7. Storage schema

One database table, two on-disk JSON files. All on the package's own
connection (`postman_clone_storage`), backed by either SQLite or the
consumer's chosen connection.

### 7.1 Table: `postman_clone_runs`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint pk | |
| `collection_id` | string, nullable | UUID from the v2.1 JSON; null for ad-hoc |
| `request_id` | string, nullable | request UUID inside the collection; null for ad-hoc |
| `request_name` | string, nullable | denormalized for history display |
| `environment_id` | string, nullable | null = no environment |
| `method` | string(10) | |
| `url_raw` | text | URL with `{{vars}}` unresolved — source of truth for replay |
| `url_resolved` | text | post-substitution; secrets masked as `••••` |
| `request_payload_json` | json | full request: headers, params, body, auth (secrets pre-masked) |
| `response_status` | int, nullable | null on network error |
| `response_headers_json` | json, nullable | |
| `response_body` | longtext, nullable | up to cap |
| `response_body_truncated` | bool | |
| `response_size_bytes` | bigint, nullable | actual size, even if truncated |
| `timing_ms` | int, nullable | total wall-clock |
| `error_kind` | enum, nullable | `network` / `timeout` / `tls` / `dns` / `unknown` |
| `error_message` | text, nullable | |
| `created_at` | timestamp | indexed for "last N runs" |

Indexes: `(created_at desc)`; `(collection_id, request_id, created_at desc)`.

**Pruning:** trim-on-write. Every 50th insert, prune rows older than
`retain_days` or beyond `retain_max_rows`. No scheduler dependency.

**Secret masking:** `request_payload_json` always stores the secret-masked
form. Run rows are reproducible (URL+headers visible) but never expose raw
secrets if the SQLite file is shared.

### 7.2 On-disk files

```
storage/postman-clone/
├── history.sqlite                       # only when storage.driver = 'sqlite'
├── environments.local.json              # per-dev env overrides
├── uploads/
│   └── <uuid>.postman_collection.json   # UI-uploaded collections
└── uploads.json                         # registry: { id, original_name, uploaded_at }
```

Shipped `.gitignore` stub:
```
/storage/postman-clone/history.sqlite
/storage/postman-clone/environments.local.json
/storage/postman-clone/uploads/
/storage/postman-clone/uploads.json
```

### 7.3 `environments.local.json` shape

```json
{
  "local":   { "bearer_token": "xyz123", "user_id": "42" },
  "staging": { "bearer_token": "from-ui-edit" }
}
```

Resolver merges `config('postman-clone.environments.{env}')` with this file;
override is authoritative for any key it defines. Concurrent writes are
serialized via `flock()`.

## 8. Frontend (React SPA)

### 8.1 Stack

- React 18 + TypeScript
- Vite for bundling; output → `resources/dist/`
- Tailwind CSS, with `primary` utility mapped to `var(--pc-primary)` so theming flows from PHP config
- Zustand for state (one store per concern, persisted where relevant)
- React Router (workspace + history routes)
- `@monaco-editor/react` for the code editor
- `fetch` wrapper that auto-prefixes `/postman/api`

### 8.2 Pages

- `WorkspacePage` (`/postman/`) — three-pane workspace.
- `HistoryPage` (`/postman/history`) — date-grouped, filterable history list; opens runs in WorkspacePage tabs.

### 8.3 Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Top bar: app_name · env switcher · history · settings                  │
├──────────────────┬──────────────────────────────────────────────────────┤
│  Sidebar         │  Tabs bar                                             │
│  ──────          ├──────────────────────────────────────────────────────┤
│  Collections     │  Request editor                                       │
│   ▸ folders      │   [METHOD ▾] [URL with {{var}} highlight]   [Send]    │
│   ▸ requests     │   Tabs: Params · Headers · Body · Auth                │
│  History         │                                                       │
│   • recent runs  │  Response viewer                                      │
│                  │   [200 OK · 87ms · 14.2 KB]                           │
│                  │   Tabs: Body · Headers · Cookies                      │
└──────────────────┴──────────────────────────────────────────────────────┘
```

### 8.4 Component tree (load-bearing parts)

```
<App>
├── <TopBar>
├── <Sidebar>
│   ├── <CollectionTree>       recursive folder/request renderer with search
│   └── <HistoryList>          date-grouped, virtualized
├── <Workspace>
│   ├── <TabsBar>
│   ├── <RequestEditor>
│   │   ├── <MethodUrlBar>
│   │   ├── <RequestSubTabs>
│   │   ├── <KeyValueTable>     reused for Params + Headers
│   │   ├── <BodyEditor>        MonacoBody | FormDataTable | UrlencodedTable | NoneBlock
│   │   └── <AuthEditor>        Bearer | Basic | API Key | None
│   └── <ResponseViewer>
│       ├── <ResponseStatusBar>
│       ├── <ResponseSubTabs>
│       └── <ResponseBodyView>  Pretty (Monaco read-only) | Raw | Preview (sandboxed iframe)
└── <CommandPalette>            backlog (Cmd+K)
```

### 8.5 State stores

```
stores/tabsStore.ts          — open tabs, active tab, dirty flag, persisted to localStorage
stores/collectionsStore.ts   — loaded collections in memory, lazy-fetched on click
stores/environmentsStore.ts  — env list + active env id
stores/historyStore.ts       — paginated; older fetched on demand
stores/uiStore.ts            — sidebar collapsed, theme, sub-tab selections; persisted
```

Each store stays under ~100 lines. `tabsStore` and `uiStore` use Zustand
`persist` middleware. Collections and history are server-truth, refetched on
boot.

### 8.6 Monaco specifics

- **Lazy-loaded** via Vite dynamic import — workspace shell renders before Monaco arrives.
- Workers via Vite's `?worker` import pattern, served from `/postman/dist/assets/`.
- Languages: JSON, XML, plaintext (extensible).
- Two instances per active tab: one writable (request body), one read-only (response body). **Disposed on tab close** to avoid leaks.

### 8.7 `{{var}}` highlighting

A `VariableHighlightedInput` component overlays a tokenized div on the input;
each `{{var}}` span is colored by resolution status (green/red/blue-masked).
Same component used in URL bar and key/value tables. In the JSON body editor,
a Monaco token provider applies the same coloring.

### 8.8 Theming wiring

The Blade shell injects CSS custom properties from `config('postman-clone.theme')`:

```blade
<html style="--pc-primary: {{ $theme['primary_color'] }}; --pc-primary-text: {{ $theme['primary_text'] }};">
```

Tailwind config in the SPA references `var(--pc-primary)`, so every
`bg-primary` / `text-primary` / `ring-primary` follows the consumer's brand
without rebuilding. App name + logo are passed to React via a
`window.__POSTMAN_CLONE__` object emitted in the same Blade view.

### 8.9 API client

- `src/api/client.ts` — typed `request()` helper, auto-prefixes `/postman/api`, throws on `!ok`.
- Per-resource modules: `collections.ts`, `environments.ts`, `runs.ts`, `history.ts`.
- `src/api/types.ts` mirrors backend DTOs (hand-maintained for v1; codegen from OpenAPI is backlog).

### 8.10 Build pipeline

- `npm run build` in `resources/spa/` → Vite emits to `resources/dist/` with `manifest.json` + content-hashed asset filenames.
- `app.blade.php` reads `manifest.json` at runtime to inject `<script>` and `<link>` tags.
- Contributors run `composer install-spa` (`cd resources/spa && npm ci && npm run build`). End consumers never run this — they get pre-built `dist/` from Packagist.

## 9. Package directory structure

```
postman-clone/
├── .git/
├── .gitignore                             # ignores resources/spa/node_modules, vendor/, etc.
├── .gitattributes                         # export-ignore resources/spa/, tests/, etc.
├── composer.json                          # autoload psr-4: HazemHammad\PostmanClone\
├── README.md                              # install, configure, screenshot
├── LICENSE                                # MIT
├── phpunit.xml
├── package.json                           # dev-only; references resources/spa
│
├── config/
│   └── postman-clone.php                  # the one config file consumers publish
│
├── database/
│   └── migrations/                        # run on package's own connection
│       └── 2026_05_02_000001_create_runs_table.php
│
├── routes/
│   └── web.php                            # /postman + /postman/api/*
│
├── resources/
│   ├── views/
│   │   └── app.blade.php                  # SPA shell
│   ├── spa/                               # ── React source (NOT shipped)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── app.tsx
│   │   │   ├── api/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── lib/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   └── dist/                              # ── built assets (THIS ships)
│       ├── manifest.json
│       └── assets/
│
├── src/                                   # PSR-4: HazemHammad\PostmanClone\
│   ├── PostmanCloneServiceProvider.php
│   ├── Console/
│   │   └── InstallCommand.php             # postman-clone:install (publishes config + assets)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AppController.php
│   │   │   ├── CollectionsController.php
│   │   │   ├── EnvironmentsController.php
│   │   │   ├── RequestRunnerController.php
│   │   │   └── HistoryController.php
│   │   ├── Middleware/
│   │   │   └── EnsurePackageEnabled.php
│   │   └── Requests/
│   ├── Services/
│   │   ├── Collections/
│   │   │   ├── CollectionLoader.php
│   │   │   ├── CollectionRegistry.php
│   │   │   └── PostmanV21Parser.php
│   │   ├── Environments/
│   │   │   ├── EnvironmentResolver.php
│   │   │   └── EnvironmentWriter.php
│   │   ├── Execution/
│   │   │   ├── RequestExecutor.php
│   │   │   ├── VariableSubstitutor.php
│   │   │   └── ResultDto.php
│   │   └── History/
│   │       └── HistoryRecorder.php
│   ├── Models/
│   │   └── Run.php
│   └── Support/
│       └── Storage.php
│
├── stubs/
│   └── postman-clone.php.stub             # what InstallCommand publishes
│
├── tests/
│   ├── TestCase.php                       # Orchestra Testbench base
│   ├── Feature/
│   │   ├── BootstrapEndpointTest.php
│   │   ├── CollectionsEndpointTest.php
│   │   ├── EnvironmentsEndpointTest.php
│   │   ├── RequestRunnerTest.php
│   │   ├── HistoryEndpointTest.php
│   │   └── AccessControlTest.php
│   └── Unit/
│       ├── PostmanV21ParserTest.php
│       ├── VariableSubstitutorTest.php
│       ├── EnvironmentResolverTest.php
│       └── RequestExecutorTest.php
│
└── docs/
    ├── specs/
    │   └── 2026-05-02-postman-clone-design.md   # this document
    ├── architecture.md                          # high-level overview for contributors
    ├── backlog.md                               # deferred features
    └── postman-v21-schema-notes.md              # what we support, what we ignore
```

Notes:

- `resources/spa/` is dev-only; excluded from Packagist tarballs via `composer.json`'s `extra.exclude-from-classmap` and `.gitattributes` `export-ignore`. Only `resources/dist/` ships.
- `src/Services/` is **framework-light** — services take DTOs and return DTOs, avoiding Eloquent and facades where reasonable. This is what makes the future MCP server (backlog) trivial to bolt on: the same `RequestExecutor` and `CollectionLoader` work behind an MCP transport with no rewrites.
- No `migrations/` are published into the consumer app. Migrations live in `database/migrations/` and are loaded via `loadMigrationsFrom()` against the package's own connection.

## 10. Error handling & edge cases

### 10.1 Failure taxonomy

| Kind | When it happens | UX |
|---|---|---|
| `network` | Connection refused, host unreachable | Red banner: "Could not connect to {host}". History row marks red. No `response_status`. |
| `dns` | Hostname doesn't resolve | "Hostname could not be resolved: {host}". |
| `tls` | Cert validation failed | Banner with one-click "Retry without TLS verification" toggle (per request). |
| `timeout` | Exceeded `execution.timeout_seconds` | "Request timed out after Ns." Offer one-shot extended timeout. |
| `unresolved_variable` | `{{var}}` has no value in active env | **Blocked client-side before send.** Send tooltip lists missing vars. |
| `invalid_request` | URL malformed, body parse error pre-send | 422 from controller; SPA shows inline field errors. |
| `body_too_large` | Response > cap | Body truncated; banner with [Download full body] (link disabled in v1). |
| `unsupported_body` | Postman v2.1 body type we don't handle | Yellow banner; other fields editable; Send disabled. |

The runtime gate's failure case (production access with `enabled_environments = ['local']`) returns 404 with **no logging** — logging the block is itself a leak vector.

### 10.2 Concurrency

- **Two browser tabs open simultaneously** — each has its own Zustand store; `localStorage` is last-write-wins. Acceptable for a dev tool.
- **Concurrent env override writes** — `EnvironmentWriter` uses `flock()` exclusive lock around read-modify-write.
- **Multiple Send clicks** — frontend disables Send while in flight; backend doesn't dedupe. History records both runs if the user really fires twice.

### 10.3 Filesystem edges

- Collection JSON missing → `CollectionMissingException` → 410 Gone → toast + sidebar refresh. Already-open tabs sourced from it stay editable.
- Invalid v2.1 schema → `InvalidCollectionException` with line/column hints. Sidebar shows the collection with a red badge; clicking shows a parser error panel instead of a tree.
- Storage path not writable → service provider boot error returns a Blade view with the resolved path.
- SQLite corrupted / out-of-disk → run write fails → 500 with masked detail; SPA toast: "Could not save run to history. Request still sent successfully." History persistence is best-effort; never blocks the actual response from reaching the user.

### 10.4 Response handling edges

- **Binary responses** (PDF, image, octet-stream) — detected via `Content-Type`. Body view shows "Binary response — {size}" with a Download button (re-executes with `?download=1`, streams via `Response::stream()`). Not rendered in Monaco.
- **Non-UTF-8 text** — `mb_convert_encoding` best-effort; falls back to binary handling.
- **Redirects** — followed by default (`max_redirects` from config). Per-request "Follow redirects" checkbox. Chain shown in response headers tab.
- **Cookies** — captured into the Cookies sub-tab. **Not persisted across requests** in v1.

### 10.5 Variable substitution edges

- **Recursive vars** — `{{a}} → "...{{b}}..."` resolved up to 3 hops then bailed with a warning.
- **Vars in JSON bodies** — substituted as raw strings; quote-preservation is the caller's responsibility (documented gotcha for numeric values).
- **Secrets in resolved URLs** — preview shows `••••`; outgoing Guzzle request uses real value; Run record stores both `url_raw` (with `{{var}}`) and `url_resolved` (with mask) — both reproducible without leaking.

### 10.6 Out of scope for v1 error handling

- Retry-with-backoff for transient failures.
- Schema validation against an OpenAPI spec.

## 11. Testing strategy

### 11.1 Stack

- **PHP**: PHPUnit + Orchestra Testbench (boots a stub Laravel app).
- **SPA**: Vitest + React Testing Library.
- **No E2E** in v1 — too heavy for a dev tool; feature tests cover the integration surface.

### 11.2 Unit tests (PHP)

| Target | Focus |
|---|---|
| `PostmanV21ParserTest` | Real v2.1 fixtures (sourced from existing `docs/postman/ticketscape.postman_collection.json`); golden-file assertions; empty folders, missing fields, deep nesting, query-only requests, raw vs JSON bodies. |
| `VariableSubstitutorTest` | URL / headers / body / nested vars; recursive resolution (3-hop limit); unresolved-var detection list. |
| `EnvironmentResolverTest` | Config-only / override-only / merged precedence; missing env id returns empty-with-warning. |
| `RequestExecutorTest` | Mock Guzzle handler. Success, network error, timeout, redirect-following, body truncation. |

### 11.3 Feature tests (PHP)

| Target | Focus |
|---|---|
| `BootstrapEndpointTest` | Shape of `/api/bootstrap`; respects access gate. |
| `CollectionsEndpointTest` | List + show; missing file → 410; bad schema → parsed error response. |
| `EnvironmentsEndpointTest` | Read merged envs; PUT creates override; concurrent writes via real `flock`. |
| `RequestRunnerTest` | Mock Guzzle. Run row created; secret masking applied; substitution failure → 422; unsupported body → 422. |
| `HistoryEndpointTest` | Pagination, filtering, prune-on-write trims. |
| `AccessControlTest` | Production env → 404; `auth` middleware redirects; Gate denies → 403. |

### 11.4 SPA component tests

| Target | Focus |
|---|---|
| `VariableHighlightedInput` | Token spans render with right colors; secret masking shows `••••`. |
| `KeyValueTable` | Add/remove/reorder; per-row disable checkbox; persists in tab state. |
| `RequestEditor` | Body mode switching preserves compatible content; clears around `none`. |
| `ResponseViewer` | Status pill colors; binary response shows download UI not Monaco. |
| `tabsStore` | Open/close/switch/dirty transitions; persistence round-trip. |

### 11.5 No tests for

Monaco itself (third-party), routing (trivial), Tailwind styles. Visual regression is backlog.

### 11.6 CI

- `composer test` runs PHP unit + feature suites.
- `npm test` in `resources/spa/` runs Vitest.
- Single GitHub Actions workflow runs both on push/PR.
- Matrix: PHP 8.2 / 8.3 / 8.4 × Laravel 11 / 12 (`composer.json` declares `^11.0|^12.0`).

### 11.7 Coverage target

80% on `src/Services/` (the framework-light core reused by the future MCP server). UI/controllers don't need a coverage number — feature tests cover the request shapes.

## 12. Backlog (not in v1)

Captured in `docs/backlog.md`. Grouped by theme:

**Access & multi-user**
- Per-user history & env override partitioning.
- Full prod-ready mode with audit log.
- Saved-views / per-user workspace pinning.

**Postman feature parity**
- Pre-request scripts & test scripts (JS sandbox).
- Collection runner / batch execution.
- Mock servers.
- Cookie jar / session continuity.
- WebSocket, GraphQL (first-class), gRPC, SSE.
- File-upload bodies > a few MB with chunked streaming.
- OpenAPI import → collection conversion.
- Insomnia import.
- Examples (saved request/response pairs).

**Editing & data**
- UI-driven write-back to the source collection JSON file (risky; needs round-trip-safe serializer).
- "Promote env override to shared config" button (writes to a sidecar JSON the PHP config reads).
- Theme tokens editable from settings drawer (full palette).

**Response handling**
- Streaming response panel (chunked rendering / SSE).
- Schema validation against OpenAPI spec → "test passed/failed" UX.
- Retry-with-backoff for transient failures.
- Diff view between two runs of the same request.

**DX & integrations**
- **MCP server** for Claude/AI tools (reuses `RequestExecutor` + `CollectionLoader`).
- **`php artisan postman-clone:generate`** — scaffold a v2.1 collection from `routes/api.php`. Reflects FormRequests for body shapes; emits one folder per controller; pre-fills `{{base_url}}`.
- Newman-compatible CLI runner (CI smoke tests).
- `'driver' => 'memory'` storage mode for CI smoke tests of the package.
- Codegen `types.ts` from a backend-emitted OpenAPI spec.
- Visual regression tests for the SPA.
- Command palette (Cmd+K).

**Performance**
- Virtualized collection-tree for huge collections.
- Response body streaming-to-disk + viewer paging.
- Background warm-up of Monaco workers.

## 13. Open questions for the implementation plan

(To be answered when the writing-plans skill turns this into a phased plan.)

- Concrete dependency pins in `composer.json` and `package.json`.
- First-implementation order: vertical slice (one collection → one request → one run) before fanning out, vs. horizontal layers (parser → resolver → executor) first.
- Whether the React SPA scaffolding (Vite + Tailwind + Zustand + Monaco wiring) is its own milestone with no backend, or integrated with the bootstrap endpoint from day one.
- Demo dogfood plan: install the package locally into Ticket-scape's backend, point it at `docs/postman/ticketscape.postman_collection.json`, validate end-to-end before tagging v0.1.
