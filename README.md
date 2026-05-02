# postman-clone

A free, open-source Postman-like UI mounted into any Laravel application.

Browse your Postman collections, edit requests, fire them server-side via
Guzzle, and inspect responses — without leaving your Laravel app.

> **Status:** v0.1.0 — local-dev-focused. Production multi-user, MCP, and
> scripting are on the roadmap. See [`docs/backlog.md`](docs/backlog.md).

## Features

- Mount a workspace at `/postman` in any Laravel 11+ / 12+ app.
- Import Postman v2.1 collection JSON from configured paths.
- Three-pane workspace: collection tree, request editor with tabs,
  response viewer (status / timing / size / body).
- Server-side execution via Guzzle — request hits your app's network,
  secrets stay server-side.
- Environments with config defaults + per-developer override JSON
  (gitignored), edit live from the UI.
- History of runs with one-click replay; secrets masked in storage.
- Theming via CSS custom properties driven by config.
- Self-contained SQLite storage by default — no migrations published into
  your app.
- Local-only by default. One config flip exposes it on staging behind any
  middleware (`auth`, `auth:sanctum`, custom Gates).

## Requirements

- PHP 8.2+
- Laravel 11.x or 12.x
- A writable `storage/` directory

## Installation

```bash
composer require hazem-hammad/postman-clone
php artisan postman-clone:install
```

The install command publishes `config/postman-clone.php`. Edit it to point
at your collection JSON files and define environments:

```php
// config/postman-clone.php
return [
    'collections' => [
        base_path('docs/postman/api.postman_collection.json'),
    ],

    'environments' => [
        'local' => [
            'base_url' => 'http://localhost:8000/api/v1',
            'token'    => env('POSTMAN_CLONE_LOCAL_TOKEN'),
        ],
    ],
    'default_environment' => 'local',

    // ... see config/postman-clone.php for all options
];
```

Visit `/postman` in your browser. (Local env only by default.)

## Configuration highlights

### Theming

```php
'theme' => [
    'primary_color' => '#FF6B35',     // your brand color
    'app_name'      => 'My API',
    'logo_url'      => '/img/logo.svg',
],
```

### Access control (when you want it on staging too)

```php
'access' => [
    'enabled_environments' => ['local', 'staging'],
    'middleware' => ['web', 'auth'],         // any middleware stack
    'gate' => 'viewPostmanClone',            // optional Laravel Gate
],
```

Define the gate in your `AuthServiceProvider`:

```php
Gate::define('viewPostmanClone', fn ($user) => $user?->is_admin === true);
```

### Environments

- Config values are baseline (committed).
- Use `env()` for secrets — they stay server-side and never reach the browser.
- Per-developer overrides live in `storage/postman-clone/environments.local.json`
  (gitignored automatically). Edit them from the UI's "Manage env" panel.
- Variable substitution uses `{{name}}` syntax (matches Postman exactly).

### Storage

Default: self-contained SQLite at `storage/postman-clone/history.sqlite` —
no migrations land in your app's main DB.

To use your app's main DB instead:

```bash
POSTMAN_CLONE_STORAGE=database
```

## What's not in v0.1 (and where it's going)

| Deferred | Plan |
|---|---|
| Monaco editor for body / response | v0.2 |
| `{{var}}` highlighting + URL preview with masked secrets | v0.2 |
| Auth helpers (Bearer / Basic / API Key as first-class tab) | v0.2 |
| MCP server for Claude / AI tools | v0.3 |
| `php artisan postman-clone:generate` (scaffold collection from `routes/api.php`) | v0.3 |
| Multi-user partitioning, scripting sandbox, mock servers | post-v0.x |

Full list: [`docs/backlog.md`](docs/backlog.md).

## Architecture

The package is a Laravel service provider that registers a small HTTP
surface and serves a pre-built React SPA. Detail in
[`docs/specs/2026-05-02-postman-clone-design.md`](docs/specs/2026-05-02-postman-clone-design.md).

## Contributing

The repo is split into a PHP package (root) and a React SPA (`resources/spa/`).
The pre-built SPA assets are committed to `resources/dist/` so end consumers
don't need Node.

For local development:

```bash
composer install
cd resources/spa && npm install && npm run build && cd ../..
composer test                                 # 61 PHP tests
cd resources/spa && npm test                  # 9 SPA tests
vendor/bin/phpstan analyse --memory-limit=512M  # 0 errors at level 5
```

## License

MIT — see [`LICENSE`](LICENSE).

## Author

[Hazem Hamaad](https://github.com/hazem-hammad)
