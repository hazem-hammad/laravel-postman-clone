# Changelog

All notable changes to `hazem-hammad/postman-clone` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] — 2026-05-02

### Added

- Laravel 11 / 12 service provider mounting at `/postman` (configurable).
- Postman v2.1 collection parser and tree-of-requests renderer.
- Server-side request execution via Guzzle with response cap, redirect
  following, and structured error classification (network / dns / tls /
  timeout).
- Environments from config + per-developer JSON override file (gitignored)
  with UI editing from the "Manage env" slide-over.
- Variable substitution (`{{var}}`) with 3-hop recursive resolution and
  cycle protection.
- Run history persisted to a self-contained SQLite file (or consumer DB
  when `POSTMAN_CLONE_STORAGE=database`). Trim-on-write retention.
- Secrets resolved server-side, masked in stored payloads + URL preview.
- React 18 + TypeScript + Tailwind SPA pre-built and shipped (no Node
  required at install).
- Three-pane workspace: collection tree, tabbed request editor
  (method / URL / params / headers / body), response viewer with status
  badge, timing, size, JSON pretty-print, headers tab.
- History sidebar with one-click replay of past runs.
- Configurable access control: env allowlist + middleware + Gate.
- Theming via CSS custom properties driven by config.
- `php artisan postman-clone:install` setup command.

### Tests

- 61 backend tests (Pest + Testbench) covering parser, env resolver,
  variable substitution, request execution, history recording, all HTTP
  endpoints, access control, install command.
- 9 SPA tests (Vitest + happy-dom) covering API client, tabs store, and
  KeyValueTable component.
- PHPStan level 5 with Larastan — 0 errors.

[0.1.0]: https://github.com/hazem-hammad/postman-clone/releases/tag/v0.1.0
[Unreleased]: https://github.com/hazem-hammad/postman-clone/compare/v0.1.0...HEAD
