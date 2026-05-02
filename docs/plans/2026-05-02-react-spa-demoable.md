# React SPA (Demoable v0.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a React SPA that mounts at `/postman` and lets a developer browse collections, edit a request, send it, and see the response — using the Plan 1 backend's HTTP API. Plain HTML inputs (no Monaco yet); read-only environment panel; no variable highlighting. Polish goes to Plan 3.

**Architecture:** Vite-built React 18 + TypeScript + Tailwind SPA living at `resources/spa/`, output to `resources/dist/` with manifest. The Plan 1 Blade shell reads `manifest.json` to inject hashed asset URLs. State managed by Zustand stores (one per concern). API client wraps `fetch` with `/postman/api` prefix.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind 3, Zustand 4, React Router 6, Vitest + React Testing Library.

**Plan source:** `postman-clone/docs/specs/2026-05-02-postman-clone-design.md` (sections 8 + parts of 6).

**Dependency:** Plan 1 backend complete (tag `plan-1-backend-complete`), all 59 tests green.

---

## File map

### resources/spa/ (Node project root for the SPA)
- Create: `resources/spa/package.json`
- Create: `resources/spa/vite.config.ts`
- Create: `resources/spa/tsconfig.json`
- Create: `resources/spa/tsconfig.node.json`
- Create: `resources/spa/tailwind.config.ts`
- Create: `resources/spa/postcss.config.js`
- Create: `resources/spa/index.html`
- Create: `resources/spa/vitest.config.ts`
- Modify: `.gitignore` — add `/resources/spa/node_modules/`, `/resources/dist/`

### resources/spa/src/
**Entry**
- Create: `resources/spa/src/main.tsx`
- Create: `resources/spa/src/app.tsx`
- Create: `resources/spa/src/styles/index.css`
- Create: `resources/spa/src/lib/runtime.ts` — reads `window.__POSTMAN_CLONE__`

**API client**
- Create: `resources/spa/src/api/client.ts`
- Create: `resources/spa/src/api/types.ts`
- Create: `resources/spa/src/api/bootstrap.ts`
- Create: `resources/spa/src/api/collections.ts`
- Create: `resources/spa/src/api/environments.ts`
- Create: `resources/spa/src/api/runs.ts`
- Create: `resources/spa/src/api/history.ts`

**State stores**
- Create: `resources/spa/src/stores/tabs-store.ts`
- Create: `resources/spa/src/stores/collections-store.ts`
- Create: `resources/spa/src/stores/environments-store.ts`
- Create: `resources/spa/src/stores/history-store.ts`
- Create: `resources/spa/src/stores/ui-store.ts`

**Components**
- Create: `resources/spa/src/components/top-bar.tsx`
- Create: `resources/spa/src/components/sidebar/sidebar.tsx`
- Create: `resources/spa/src/components/sidebar/collection-tree.tsx`
- Create: `resources/spa/src/components/sidebar/history-list.tsx`
- Create: `resources/spa/src/components/workspace/workspace.tsx`
- Create: `resources/spa/src/components/workspace/tabs-bar.tsx`
- Create: `resources/spa/src/components/workspace/empty-state.tsx`
- Create: `resources/spa/src/components/request-editor/request-editor.tsx`
- Create: `resources/spa/src/components/request-editor/method-url-bar.tsx`
- Create: `resources/spa/src/components/request-editor/request-sub-tabs.tsx`
- Create: `resources/spa/src/components/request-editor/key-value-table.tsx`
- Create: `resources/spa/src/components/request-editor/body-editor.tsx`
- Create: `resources/spa/src/components/request-editor/auth-editor.tsx`
- Create: `resources/spa/src/components/response-viewer/response-viewer.tsx`
- Create: `resources/spa/src/components/response-viewer/response-status-bar.tsx`
- Create: `resources/spa/src/components/response-viewer/response-body-view.tsx`
- Create: `resources/spa/src/components/env-panel/env-panel.tsx` (read-only)

**Pages**
- Create: `resources/spa/src/pages/workspace-page.tsx`
- Create: `resources/spa/src/pages/history-page.tsx`

**Tests**
- Create: `resources/spa/src/stores/tabs-store.test.ts`
- Create: `resources/spa/src/api/client.test.ts`
- Create: `resources/spa/src/components/request-editor/key-value-table.test.tsx`

### Backend changes
- Modify: `resources/views/app.blade.php` — read `resources/dist/manifest.json` and emit hashed asset tags
- Modify: `src/Http/Controllers/AppController.php` — pass manifest data to view

---

## PHASE 0 — SPA scaffold (Vite + React + TS + Tailwind)

### Task 0.1: Initialize Node project for the SPA

**Files:**
- Create: `resources/spa/package.json`

- [ ] **Step 1: Make the directory and write package.json**

```bash
mkdir -p resources/spa/src
```

`resources/spa/package.json`:
```json
{
  "name": "postman-clone-spa",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "happy-dom": "^15.10.2",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Install**

```bash
cd resources/spa && npm install
```

Expected: ~200 packages installed, no errors.

- [ ] **Step 3: Update root .gitignore**

Add lines (verify they exist; the Plan 1 .gitignore already has `/resources/spa/node_modules/` and `/resources/spa/dist/` patterns — confirm by reading):
```
/resources/spa/node_modules/
/resources/dist/
```

- [ ] **Step 4: Commit**

```bash
git add resources/spa/package.json resources/spa/package-lock.json .gitignore
git commit -m "chore(spa): initialize React + Vite + TS Node project"
```

---

### Task 0.2: TypeScript + Vite + Tailwind config

**Files:**
- Create: `resources/spa/tsconfig.json`
- Create: `resources/spa/tsconfig.node.json`
- Create: `resources/spa/vite.config.ts`
- Create: `resources/spa/tailwind.config.ts`
- Create: `resources/spa/postcss.config.js`
- Create: `resources/spa/index.html`
- Create: `resources/spa/src/styles/index.css`

- [ ] **Step 1: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "tailwind.config.ts"]
}
```

- [ ] **Step 3: vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  base: '/postman/dist/',
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.tsx'),
    },
  },
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 4: tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--pc-primary)',
        'primary-text': 'var(--pc-primary-text)',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: index.html (Vite dev entry)**

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Postman Clone — dev</title>
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.__POSTMAN_CLONE__ = {
        theme: { primary_color: '#0B5FFF', primary_text: '#FFFFFF', app_name: 'Postman Clone' },
        route_prefix: 'postman',
      };
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: src/styles/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --pc-primary: #0B5FFF;
  --pc-primary-text: #FFFFFF;
}

html, body, #app { height: 100%; }
body { font-family: ui-sans-serif, system-ui, sans-serif; }
```

- [ ] **Step 8: Commit**

```bash
git add resources/spa/tsconfig.json resources/spa/tsconfig.node.json resources/spa/vite.config.ts resources/spa/tailwind.config.ts resources/spa/postcss.config.js resources/spa/index.html resources/spa/src/styles/index.css
git commit -m "chore(spa): configure TS, Vite, Tailwind, PostCSS, entry HTML"
```

---

### Task 0.3: Entry + minimal App + verify dev server

**Files:**
- Create: `resources/spa/src/main.tsx`
- Create: `resources/spa/src/app.tsx`
- Create: `resources/spa/src/lib/runtime.ts`

- [ ] **Step 1: src/lib/runtime.ts**

```ts
export type Theme = {
  primary_color: string;
  primary_text: string;
  app_name: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  default_mode?: 'light' | 'dark' | 'system';
};

export type Runtime = {
  theme: Theme;
  route_prefix: string;
};

declare global {
  interface Window {
    __POSTMAN_CLONE__: Runtime;
  }
}

export function getRuntime(): Runtime {
  if (typeof window === 'undefined' || !window.__POSTMAN_CLONE__) {
    throw new Error('window.__POSTMAN_CLONE__ not set — Blade shell did not bootstrap the SPA.');
  }
  return window.__POSTMAN_CLONE__;
}

export function getApiBase(): string {
  const { route_prefix } = getRuntime();
  return `/${route_prefix}/api`;
}
```

- [ ] **Step 2: src/app.tsx**

```tsx
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
```

- [ ] **Step 3: src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import './styles/index.css';

const root = document.getElementById('app');
if (!root) throw new Error('No #app element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Run dev server briefly to verify it boots**

```bash
cd resources/spa && timeout 5 npm run dev 2>&1 | head -10 || true
```

Expected: "VITE v5.x ready in Xms" + "Local: http://localhost:5173" message. (Timeout kills it; we don't need the long-running process.)

- [ ] **Step 5: Verify production build**

```bash
cd resources/spa && npm run build
```

Expected: `../dist/manifest.json` and hashed assets created with no TS errors.

- [ ] **Step 6: Commit**

```bash
git add resources/spa/src/main.tsx resources/spa/src/app.tsx resources/spa/src/lib/runtime.ts
git commit -m "feat(spa): entry + minimal App; dev server boots and prod build emits manifest"
```

---

### Task 0.4: Vitest setup

**Files:**
- Create: `resources/spa/vitest.config.ts`
- Create: `resources/spa/src/test-setup.ts`

- [ ] **Step 1: vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 2: src/test-setup.ts**

```ts
import '@testing-library/jest-dom/vitest';

// Default runtime stub for tests; individual tests can override.
(globalThis as any).window ||= {};
(window as any).__POSTMAN_CLONE__ = {
  theme: { primary_color: '#0B5FFF', primary_text: '#FFFFFF', app_name: 'Postman Clone' },
  route_prefix: 'postman',
};
```

- [ ] **Step 3: Verify vitest runs (no tests yet)**

```bash
cd resources/spa && npm test 2>&1 | tail -5
```

Expected: "No test files found" — that's fine.

- [ ] **Step 4: Commit**

```bash
git add resources/spa/vitest.config.ts resources/spa/src/test-setup.ts
git commit -m "chore(spa): configure vitest with happy-dom + @testing-library/jest-dom"
```

---

## PHASE 1 — API client + types

### Task 1.1: Shared types

**Files:**
- Create: `resources/spa/src/api/types.ts`

- [ ] **Step 1: Write types matching the backend response shapes**

```ts
export type CollectionEntry = {
  id: string;
  name: string;
  source: 'config' | 'upload';
  missing: boolean;
};

export type EnvironmentSummary = { id: string; variable_count: number };

export type Bootstrap = {
  collections: CollectionEntry[];
  environments: EnvironmentSummary[];
  active_environment: string | null;
  history_count: number;
};

export type KeyValue = { key: string; value: string; disabled?: boolean };

export type RequestNode = {
  type: 'request';
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body_mode: string | null;
  body: unknown;
  auth: Record<string, unknown> | null;
};

export type FolderNode = {
  type: 'folder';
  id: string;
  name: string;
  items: TreeNode[];
};

export type TreeNode = FolderNode | RequestNode;

export type CollectionDetail = {
  id: string;
  name: string;
  description: string | null;
  variables: Record<string, string>;
  items: TreeNode[];
};

export type EnvironmentVariable = {
  name: string;
  value: string;
  is_secret: boolean;
  source: 'collection' | 'config' | 'override';
};

export type EnvironmentDetail = {
  id: string;
  variables: EnvironmentVariable[];
};

export type RunResult = {
  status: number | null;
  headers: Record<string, string[]>;
  body: string | null;
  body_truncated: boolean;
  size_bytes: number | null;
  timing_ms: number;
  error_kind: string | null;
  error_message: string | null;
};

export type RunRecordSummary = {
  id: number;
  method: string;
  url_raw: string;
  url_resolved: string;
  response_status: number | null;
  error_kind: string | null;
  timing_ms: number | null;
  request_name: string | null;
  collection_id: string | null;
  request_id: string | null;
  created_at: string | null;
};

export type RunRecordFull = RunRecordSummary & {
  environment_id: string | null;
  request_payload_json: Record<string, unknown>;
  response_headers_json: Record<string, string[]> | null;
  response_body: string | null;
  response_body_truncated: boolean;
  response_size_bytes: number | null;
  error_message: string | null;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add resources/spa/src/api/types.ts
git commit -m "feat(spa): API response types matching backend DTOs"
```

---

### Task 1.2: Fetch wrapper (TDD)

**Files:**
- Create: `resources/spa/src/api/client.ts`
- Create: `resources/spa/src/api/client.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request, ApiError } from './client';

describe('api client', () => {
  beforeEach(() => {
    (window as any).__POSTMAN_CLONE__ = { theme: {}, route_prefix: 'postman' };
  });

  it('prefixes the route prefix and parses JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await request<{ hello: string }>('/bootstrap');

    expect(fetchMock).toHaveBeenCalledWith('/postman/api/bootstrap', expect.any(Object));
    expect(result).toEqual({ hello: 'world' });
  });

  it('throws ApiError with status on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ message: 'Gone' }),
    }));

    await expect(request('/collections/missing')).rejects.toMatchObject({
      status: 410,
    });
  });

  it('JSON-stringifies object bodies and sets Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/runs', { method: 'POST', body: { url: 'x' } });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe('POST');
    expect(call[1].headers['Content-Type']).toBe('application/json');
    expect(call[1].body).toBe(JSON.stringify({ url: 'x' }));
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
cd resources/spa && npm test
```

Expected: tests fail because `client.ts` doesn't exist.

- [ ] **Step 3: Implement**

`resources/spa/src/api/client.ts`:
```ts
import { getApiBase } from '@/lib/runtime';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly payload: unknown) {
    super(`API error ${status}`);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, json);
  }
  return json as T;
}
```

- [ ] **Step 4: Run — pass**

```bash
cd resources/spa && npm test
```

Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add resources/spa/src/api/client.ts resources/spa/src/api/client.test.ts
git commit -m "feat(spa): typed fetch wrapper with /postman/api prefix and ApiError"
```

---

### Task 1.3: Resource modules

**Files:**
- Create: `resources/spa/src/api/bootstrap.ts`
- Create: `resources/spa/src/api/collections.ts`
- Create: `resources/spa/src/api/environments.ts`
- Create: `resources/spa/src/api/runs.ts`
- Create: `resources/spa/src/api/history.ts`

- [ ] **Step 1: All five files**

`resources/spa/src/api/bootstrap.ts`:
```ts
import { request } from './client';
import type { Bootstrap } from './types';

export const fetchBootstrap = () => request<Bootstrap>('/bootstrap');
```

`resources/spa/src/api/collections.ts`:
```ts
import { request } from './client';
import type { CollectionDetail, CollectionEntry } from './types';

export const listCollections = () =>
  request<{ data: CollectionEntry[] }>('/collections').then((r) => r.data);

export const showCollection = (id: string) =>
  request<CollectionDetail>(`/collections/${encodeURIComponent(id)}`);
```

`resources/spa/src/api/environments.ts`:
```ts
import { request } from './client';
import type { EnvironmentDetail } from './types';

export const listEnvironments = () =>
  request<{ data: EnvironmentDetail[] }>('/environments').then((r) => r.data);
```

`resources/spa/src/api/runs.ts`:
```ts
import { request } from './client';
import type { KeyValue, RunResult } from './types';

export type RunInput = {
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body_mode: string | null;
  body: unknown;
  environment_id: string | null;
  collection_id: string | null;
  request_id: string | null;
  request_name: string | null;
};

export const sendRun = (input: RunInput) =>
  request<{ run_id: number; result: RunResult }>('/runs', { method: 'POST', body: input });
```

`resources/spa/src/api/history.ts`:
```ts
import { request } from './client';
import type { Paginated, RunRecordFull, RunRecordSummary } from './types';

export const listHistory = (perPage = 50) =>
  request<Paginated<RunRecordSummary>>(`/history?per_page=${perPage}`);

export const showRun = (id: number) => request<RunRecordFull>(`/runs/${id}`);
export const deleteRun = (id: number) => request<{ ok: true }>(`/runs/${id}`, { method: 'DELETE' });
```

- [ ] **Step 2: Commit**

```bash
git add resources/spa/src/api/bootstrap.ts resources/spa/src/api/collections.ts resources/spa/src/api/environments.ts resources/spa/src/api/runs.ts resources/spa/src/api/history.ts
git commit -m "feat(spa): per-resource API modules (bootstrap, collections, environments, runs, history)"
```

---

## PHASE 2 — Zustand stores

### Task 2.1: tabsStore (TDD)

**Files:**
- Create: `resources/spa/src/stores/tabs-store.ts`
- Create: `resources/spa/src/stores/tabs-store.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTabsStore } from './tabs-store';

const reset = () => useTabsStore.setState({ tabs: [], activeId: null });

describe('tabsStore', () => {
  beforeEach(reset);

  it('opens a new tab and makes it active', () => {
    useTabsStore.getState().openRequestTab({
      collectionId: 'c1', requestId: 'r1', name: 'List items',
      method: 'GET', url: 'https://x.test/items',
      headers: [], params: [], bodyMode: null, body: null,
    });
    expect(useTabsStore.getState().tabs).toHaveLength(1);
    expect(useTabsStore.getState().activeId).toBe(useTabsStore.getState().tabs[0].id);
  });

  it('reuses an existing tab when opening the same request', () => {
    const open = useTabsStore.getState().openRequestTab;
    open({ collectionId: 'c1', requestId: 'r1', name: 'a', method: 'GET', url: 'u', headers: [], params: [], bodyMode: null, body: null });
    open({ collectionId: 'c1', requestId: 'r1', name: 'a', method: 'GET', url: 'u', headers: [], params: [], bodyMode: null, body: null });
    expect(useTabsStore.getState().tabs).toHaveLength(1);
  });

  it('closes a tab and shifts active id', () => {
    const open = useTabsStore.getState().openRequestTab;
    open({ collectionId: 'c1', requestId: 'r1', name: 'a', method: 'GET', url: 'u', headers: [], params: [], bodyMode: null, body: null });
    open({ collectionId: 'c1', requestId: 'r2', name: 'b', method: 'GET', url: 'u', headers: [], params: [], bodyMode: null, body: null });
    const ids = useTabsStore.getState().tabs.map((t) => t.id);
    useTabsStore.getState().closeTab(ids[1]);
    expect(useTabsStore.getState().tabs).toHaveLength(1);
    expect(useTabsStore.getState().activeId).toBe(ids[0]);
  });

  it('updates fields on a tab', () => {
    const open = useTabsStore.getState().openRequestTab;
    open({ collectionId: 'c', requestId: 'r', name: 'a', method: 'GET', url: 'u', headers: [], params: [], bodyMode: null, body: null });
    const id = useTabsStore.getState().tabs[0].id;
    useTabsStore.getState().updateTab(id, { url: 'new-url' });
    expect(useTabsStore.getState().tabs[0].url).toBe('new-url');
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```ts
import { create } from 'zustand';
import type { KeyValue, RunResult } from '@/api/types';

export type Tab = {
  id: string;
  collectionId: string | null;
  requestId: string | null;
  name: string;
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  bodyMode: string | null;
  body: unknown;
  lastResult: RunResult | null;
  sending: boolean;
  dirty: boolean;
};

type OpenInput = Omit<Tab, 'id' | 'lastResult' | 'sending' | 'dirty'>;

type State = {
  tabs: Tab[];
  activeId: string | null;
  openRequestTab: (input: OpenInput) => void;
  closeTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<Tab>) => void;
  setActive: (id: string) => void;
  setSending: (id: string, sending: boolean) => void;
  setResult: (id: string, result: RunResult) => void;
};

let nextId = 1;
const newId = () => `tab-${nextId++}`;

export const useTabsStore = create<State>((set, get) => ({
  tabs: [],
  activeId: null,

  openRequestTab(input) {
    const existing = get().tabs.find(
      (t) => t.collectionId === input.collectionId && t.requestId === input.requestId
    );
    if (existing) {
      set({ activeId: existing.id });
      return;
    }
    const id = newId();
    set({
      tabs: [
        ...get().tabs,
        { ...input, id, lastResult: null, sending: false, dirty: false },
      ],
      activeId: id,
    });
  },

  closeTab(id) {
    const { tabs, activeId } = get();
    const remaining = tabs.filter((t) => t.id !== id);
    let nextActive = activeId;
    if (activeId === id) {
      nextActive = remaining[remaining.length - 1]?.id ?? null;
    }
    set({ tabs: remaining, activeId: nextActive });
  },

  updateTab(id, patch) {
    set({
      tabs: get().tabs.map((t) => (t.id === id ? { ...t, ...patch, dirty: true } : t)),
    });
  },

  setActive(id) {
    set({ activeId: id });
  },

  setSending(id, sending) {
    set({
      tabs: get().tabs.map((t) => (t.id === id ? { ...t, sending } : t)),
    });
  },

  setResult(id, result) {
    set({
      tabs: get().tabs.map((t) => (t.id === id ? { ...t, lastResult: result, sending: false } : t)),
    });
  },
}));
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add resources/spa/src/stores/tabs-store.ts resources/spa/src/stores/tabs-store.test.ts
git commit -m "feat(spa): tabsStore with open/close/update/active actions and de-dup"
```

---

### Task 2.2: Other four stores (no tests; trivial wrappers)

**Files:**
- Create: `resources/spa/src/stores/collections-store.ts`
- Create: `resources/spa/src/stores/environments-store.ts`
- Create: `resources/spa/src/stores/history-store.ts`
- Create: `resources/spa/src/stores/ui-store.ts`

- [ ] **Step 1: collections-store.ts**

```ts
import { create } from 'zustand';
import type { CollectionDetail, CollectionEntry } from '@/api/types';
import { listCollections, showCollection } from '@/api/collections';

type State = {
  entries: CollectionEntry[];
  loaded: Record<string, CollectionDetail>;
  loadingIds: Set<string>;
  error: string | null;

  refresh: () => Promise<void>;
  ensureLoaded: (id: string) => Promise<CollectionDetail | null>;
};

export const useCollectionsStore = create<State>((set, get) => ({
  entries: [],
  loaded: {},
  loadingIds: new Set(),
  error: null,

  async refresh() {
    try {
      const entries = await listCollections();
      set({ entries, error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load collections' });
    }
  },

  async ensureLoaded(id) {
    if (get().loaded[id]) return get().loaded[id];
    if (get().loadingIds.has(id)) return null;
    const next = new Set(get().loadingIds);
    next.add(id);
    set({ loadingIds: next });
    try {
      const detail = await showCollection(id);
      set({ loaded: { ...get().loaded, [id]: detail } });
      return detail;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : `Failed to load ${id}` });
      return null;
    } finally {
      const after = new Set(get().loadingIds);
      after.delete(id);
      set({ loadingIds: after });
    }
  },
}));
```

- [ ] **Step 2: environments-store.ts**

```ts
import { create } from 'zustand';
import type { EnvironmentDetail } from '@/api/types';
import { listEnvironments } from '@/api/environments';

type State = {
  environments: EnvironmentDetail[];
  activeId: string | null;
  refresh: () => Promise<void>;
  setActive: (id: string | null) => void;
};

export const useEnvironmentsStore = create<State>((set) => ({
  environments: [],
  activeId: null,
  async refresh() {
    const environments = await listEnvironments();
    set({ environments });
  },
  setActive(id) {
    set({ activeId: id });
  },
}));
```

- [ ] **Step 3: history-store.ts**

```ts
import { create } from 'zustand';
import type { RunRecordSummary } from '@/api/types';
import { listHistory } from '@/api/history';

type State = {
  recent: RunRecordSummary[];
  total: number;
  loading: boolean;
  refresh: () => Promise<void>;
  prepend: (record: RunRecordSummary) => void;
};

export const useHistoryStore = create<State>((set) => ({
  recent: [],
  total: 0,
  loading: false,
  async refresh() {
    set({ loading: true });
    const page = await listHistory(50);
    set({ recent: page.data, total: page.meta.total, loading: false });
  },
  prepend(record) {
    set((s) => ({ recent: [record, ...s.recent].slice(0, 50), total: s.total + 1 }));
  },
}));
```

- [ ] **Step 4: ui-store.ts**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RequestSubTab = 'params' | 'headers' | 'body' | 'auth';
export type ResponseSubTab = 'body' | 'headers';

type State = {
  sidebarCollapsed: boolean;
  requestSubTab: RequestSubTab;
  responseSubTab: ResponseSubTab;
  envPanelOpen: boolean;

  toggleSidebar: () => void;
  setRequestSubTab: (t: RequestSubTab) => void;
  setResponseSubTab: (t: ResponseSubTab) => void;
  toggleEnvPanel: () => void;
};

export const useUiStore = create<State>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      requestSubTab: 'params',
      responseSubTab: 'body',
      envPanelOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setRequestSubTab: (t) => set({ requestSubTab: t }),
      setResponseSubTab: (t) => set({ responseSubTab: t }),
      toggleEnvPanel: () => set((s) => ({ envPanelOpen: !s.envPanelOpen })),
    }),
    { name: 'postman-clone-ui' }
  )
);
```

- [ ] **Step 5: Type-check + commit**

```bash
cd resources/spa && npm run build
git add resources/spa/src/stores/
git commit -m "feat(spa): collections, environments, history, ui stores"
```

---

## PHASE 3 — Layout shell + bootstrap

### Task 3.1: Top bar + layout shell + workspace empty state

**Files:**
- Create: `resources/spa/src/components/top-bar.tsx`
- Create: `resources/spa/src/components/sidebar/sidebar.tsx`
- Create: `resources/spa/src/components/workspace/workspace.tsx`
- Create: `resources/spa/src/components/workspace/empty-state.tsx`
- Modify: `resources/spa/src/app.tsx`

- [ ] **Step 1: top-bar.tsx**

```tsx
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { getRuntime } from '@/lib/runtime';

export function TopBar() {
  const { theme } = getRuntime();
  const { environments, activeId, setActive } = useEnvironmentsStore();
  const historyCount = useHistoryStore((s) => s.total);

  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-zinc-200 bg-white">
      <div className="flex items-center gap-3">
        {theme.logo_url ? <img src={theme.logo_url} alt="" className="h-6" /> : null}
        <h1 className="text-sm font-semibold text-zinc-900">{theme.app_name}</h1>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={activeId ?? ''}
          onChange={(e) => setActive(e.target.value || null)}
          className="text-sm border border-zinc-300 rounded px-2 py-1 bg-white"
        >
          <option value="">No environment</option>
          {environments.map((e) => (
            <option key={e.id} value={e.id}>{e.id}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">{historyCount} runs</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: sidebar/sidebar.tsx**

```tsx
import { CollectionTree } from './collection-tree';
import { HistoryList } from './history-list';

export function Sidebar() {
  return (
    <aside className="w-72 border-r border-zinc-200 bg-zinc-50 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <section>
          <h2 className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Collections</h2>
          <CollectionTree />
        </section>
        <section className="mt-4">
          <h2 className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">History</h2>
          <HistoryList />
        </section>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: workspace/empty-state.tsx**

```tsx
export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
      Select a request from the sidebar to start.
    </div>
  );
}
```

- [ ] **Step 4: workspace/workspace.tsx**

```tsx
import { useTabsStore } from '@/stores/tabs-store';
import { TabsBar } from './tabs-bar';
import { EmptyState } from './empty-state';
import { RequestEditor } from '../request-editor/request-editor';
import { ResponseViewer } from '../response-viewer/response-viewer';

export function Workspace() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const tab = tabs.find((t) => t.id === activeId) ?? null;

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      <TabsBar />
      {tab === null ? <EmptyState /> : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <RequestEditor tabId={tab.id} />
          <ResponseViewer tabId={tab.id} />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 5: src/app.tsx (replace)**

```tsx
import { useEffect } from 'react';
import { TopBar } from '@/components/top-bar';
import { Sidebar } from '@/components/sidebar/sidebar';
import { Workspace } from '@/components/workspace/workspace';
import { useCollectionsStore } from '@/stores/collections-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { fetchBootstrap } from '@/api/bootstrap';

export function App() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const boot = await fetchBootstrap();
        if (cancelled) return;
        useEnvironmentsStore.setState({
          environments: boot.environments.map((e) => ({ id: e.id, variables: [] })),
          activeId: boot.active_environment,
        });
        useHistoryStore.setState({ total: boot.history_count });
        useCollectionsStore.setState({
          entries: boot.collections.map((c) => ({ ...c })),
        });
      } catch (e) {
        console.error('bootstrap failed', e);
      }
    })();
    void useCollectionsStore.getState().refresh();
    void useEnvironmentsStore.getState().refresh();
    void useHistoryStore.getState().refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <Workspace />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Type-check (build will fail until tabs-bar / collection-tree / history-list / request-editor / response-viewer exist — Phases 4-6 fill these in). For now, stub them so build passes:**

`resources/spa/src/components/sidebar/collection-tree.tsx`:
```tsx
export function CollectionTree() { return <div className="text-xs text-zinc-400 px-3">Loading…</div>; }
```

`resources/spa/src/components/sidebar/history-list.tsx`:
```tsx
export function HistoryList() { return <div className="text-xs text-zinc-400 px-3">No history yet.</div>; }
```

`resources/spa/src/components/workspace/tabs-bar.tsx`:
```tsx
export function TabsBar() { return <div className="h-9 border-b border-zinc-200 bg-white" />; }
```

`resources/spa/src/components/request-editor/request-editor.tsx`:
```tsx
export function RequestEditor({ tabId }: { tabId: string }) { return <div className="p-4 text-zinc-400">Request editor for {tabId}</div>; }
```

`resources/spa/src/components/response-viewer/response-viewer.tsx`:
```tsx
export function ResponseViewer({ tabId }: { tabId: string }) { return <div className="p-4 text-zinc-400 border-t border-zinc-200">Response for {tabId}</div>; }
```

- [ ] **Step 7: Verify build**

```bash
cd resources/spa && npm run build
```

Expected: success.

- [ ] **Step 8: Commit**

```bash
git add resources/spa/src/components/ resources/spa/src/app.tsx
git commit -m "feat(spa): app shell — top bar, sidebar, workspace + empty state, bootstrap effect"
```

---

## PHASE 4 — Collection tree

### Task 4.1: Recursive CollectionTree with click-to-open-tab

**Files:**
- Modify: `resources/spa/src/components/sidebar/collection-tree.tsx`

- [ ] **Step 1: Replace stub with full implementation**

```tsx
import { useEffect, useState } from 'react';
import { useCollectionsStore } from '@/stores/collections-store';
import { useTabsStore } from '@/stores/tabs-store';
import type { CollectionEntry, FolderNode, RequestNode, TreeNode } from '@/api/types';

export function CollectionTree() {
  const entries = useCollectionsStore((s) => s.entries);

  if (entries.length === 0) {
    return <div className="text-xs text-zinc-400 px-3 py-1">No collections configured.</div>;
  }

  return (
    <ul>
      {entries.map((e) => (
        <CollectionNode key={e.id} entry={e} />
      ))}
    </ul>
  );
}

function CollectionNode({ entry }: { entry: CollectionEntry }) {
  const [expanded, setExpanded] = useState(false);
  const ensureLoaded = useCollectionsStore((s) => s.ensureLoaded);
  const detail = useCollectionsStore((s) => s.loaded[entry.id]);

  const onToggle = async () => {
    if (!expanded && !detail && !entry.missing) {
      await ensureLoaded(entry.id);
    }
    setExpanded(!expanded);
  };

  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <span className="text-zinc-400">{expanded ? '▾' : '▸'}</span>
        <span className={entry.missing ? 'text-red-500' : 'text-zinc-700 font-medium'}>
          {entry.name}
        </span>
        {entry.missing ? <span className="text-xs text-red-500">(missing)</span> : null}
      </button>
      {expanded && detail ? (
        <ul className="ml-3 border-l border-zinc-200">
          {detail.items.map((item) => <TreeItem key={item.id} item={item} collectionId={entry.id} />)}
        </ul>
      ) : null}
    </li>
  );
}

function TreeItem({ item, collectionId }: { item: TreeNode; collectionId: string }) {
  if (item.type === 'folder') {
    return <FolderItem item={item} collectionId={collectionId} />;
  }
  return <RequestItem item={item} collectionId={collectionId} />;
}

function FolderItem({ item, collectionId }: { item: FolderNode; collectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-2 py-1 text-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <span className="text-zinc-400">{expanded ? '▾' : '▸'}</span>
        <span className="text-zinc-700">{item.name}</span>
      </button>
      {expanded ? (
        <ul className="ml-3 border-l border-zinc-200">
          {item.items.map((c) => <TreeItem key={c.id} item={c} collectionId={collectionId} />)}
        </ul>
      ) : null}
    </li>
  );
}

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-red-600',
};

function RequestItem({ item, collectionId }: { item: RequestNode; collectionId: string }) {
  const open = useTabsStore((s) => s.openRequestTab);
  return (
    <li>
      <button
        onClick={() => open({
          collectionId,
          requestId: item.id,
          name: item.name,
          method: item.method,
          url: item.url,
          headers: item.headers,
          params: item.params,
          bodyMode: item.body_mode,
          body: item.body,
        })}
        className="w-full text-left px-2 py-1 text-sm hover:bg-zinc-200 flex items-center gap-2"
      >
        <span className={`text-[10px] font-bold ${METHOD_COLOR[item.method] ?? 'text-zinc-500'}`}>
          {item.method}
        </span>
        <span className="text-zinc-700 truncate">{item.name}</span>
      </button>
    </li>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
cd resources/spa && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add resources/spa/src/components/sidebar/collection-tree.tsx
git commit -m "feat(spa): recursive CollectionTree with lazy detail load and click-to-open"
```

---

## PHASE 5 — Tabs bar

### Task 5.1: TabsBar with close button

**Files:**
- Modify: `resources/spa/src/components/workspace/tabs-bar.tsx`

- [ ] **Step 1: Replace stub**

```tsx
import { useTabsStore } from '@/stores/tabs-store';

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-red-600',
};

export function TabsBar() {
  const { tabs, activeId, setActive, closeTab } = useTabsStore();

  if (tabs.length === 0) return <div className="h-9 border-b border-zinc-200 bg-white" />;

  return (
    <div className="h-9 border-b border-zinc-200 bg-white flex items-stretch overflow-x-auto">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-3 border-r border-zinc-200 cursor-pointer min-w-0 ${
            t.id === activeId ? 'bg-zinc-50' : 'hover:bg-zinc-50'
          }`}
          onClick={() => setActive(t.id)}
        >
          <span className={`text-[10px] font-bold ${METHOD_COLOR[t.method] ?? 'text-zinc-500'}`}>
            {t.method}
          </span>
          <span className="text-sm text-zinc-700 truncate max-w-[14rem]">{t.name}</span>
          {t.dirty ? <span className="text-zinc-400 text-xs">●</span> : null}
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
            className="text-zinc-400 hover:text-zinc-700 text-xs"
            aria-label={`Close ${t.name}`}
          >×</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/spa/src/components/workspace/tabs-bar.tsx
git commit -m "feat(spa): TabsBar with active highlight, dirty dot, close button"
```

---

## PHASE 6 — Request editor

### Task 6.1: KeyValueTable (TDD)

**Files:**
- Create: `resources/spa/src/components/request-editor/key-value-table.tsx`
- Create: `resources/spa/src/components/request-editor/key-value-table.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyValueTable } from './key-value-table';

describe('KeyValueTable', () => {
  it('renders rows and adds a new empty row when typing in the empty trailer', () => {
    const onChange = vi.fn();
    render(
      <KeyValueTable
        rows={[{ key: 'Accept', value: 'application/json', disabled: false }]}
        onChange={onChange}
        placeholder="Header"
      />
    );

    expect(screen.getByDisplayValue('Accept')).toBeInTheDocument();
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
  });

  it('toggles a row disabled', () => {
    const onChange = vi.fn();
    render(
      <KeyValueTable
        rows={[{ key: 'X', value: 'Y', disabled: false }]}
        onChange={onChange}
        placeholder="x"
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0];
    expect(next[0].disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```tsx
import type { KeyValue } from '@/api/types';

type Props = {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  placeholder: string;
};

export function KeyValueTable({ rows, onChange, placeholder }: Props) {
  const all = [...rows, { key: '', value: '', disabled: false }];

  const update = (i: number, patch: Partial<KeyValue>) => {
    const next = all.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next.filter((r, idx) => idx < next.length - 1 || r.key !== '' || r.value !== ''));
  };

  const remove = (i: number) => {
    onChange(rows.filter((_, j) => j !== i));
  };

  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-zinc-500 text-left">
        <tr>
          <th className="w-8"></th>
          <th className="px-2 py-1">Key</th>
          <th className="px-2 py-1">Value</th>
          <th className="w-8"></th>
        </tr>
      </thead>
      <tbody>
        {all.map((row, i) => {
          const isTrailer = i === all.length - 1;
          return (
            <tr key={i} className="border-t border-zinc-100">
              <td className="px-2 py-1 text-center">
                {!isTrailer ? (
                  <input
                    type="checkbox"
                    checked={!row.disabled}
                    onChange={(e) => update(i, { disabled: !e.target.checked })}
                  />
                ) : null}
              </td>
              <td className="px-2 py-1">
                <input
                  className="w-full bg-transparent border-0 outline-none px-1 py-0.5 focus:bg-zinc-50"
                  value={row.key}
                  placeholder={`${placeholder} key`}
                  onChange={(e) => update(i, { key: e.target.value })}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  className="w-full bg-transparent border-0 outline-none px-1 py-0.5 focus:bg-zinc-50"
                  value={row.value}
                  placeholder="value"
                  onChange={(e) => update(i, { value: e.target.value })}
                />
              </td>
              <td className="px-2 py-1 text-center">
                {!isTrailer ? (
                  <button onClick={() => remove(i)} className="text-zinc-400 hover:text-red-600 text-xs">×</button>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add resources/spa/src/components/request-editor/key-value-table.tsx resources/spa/src/components/request-editor/key-value-table.test.tsx
git commit -m "feat(spa): KeyValueTable with auto-add row, disable checkbox, delete"
```

---

### Task 6.2: MethodUrlBar + RequestSubTabs + BodyEditor + AuthEditor + RequestEditor

**Files:**
- Create: `resources/spa/src/components/request-editor/method-url-bar.tsx`
- Create: `resources/spa/src/components/request-editor/request-sub-tabs.tsx`
- Create: `resources/spa/src/components/request-editor/body-editor.tsx`
- Create: `resources/spa/src/components/request-editor/auth-editor.tsx`
- Modify: `resources/spa/src/components/request-editor/request-editor.tsx`

- [ ] **Step 1: method-url-bar.tsx**

```tsx
import { useTabsStore } from '@/stores/tabs-store';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function MethodUrlBar({ tabId, onSend }: { tabId: string; onSend: () => void }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  if (!tab) return null;

  return (
    <div className="flex items-center gap-2 p-3 border-b border-zinc-200">
      <select
        value={tab.method}
        onChange={(e) => update(tabId, { method: e.target.value })}
        className="border border-zinc-300 rounded px-2 py-1.5 text-sm font-medium"
      >
        {METHODS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <input
        value={tab.url}
        onChange={(e) => update(tabId, { url: e.target.value })}
        placeholder="https://api.example.com/path or {{base_url}}/path"
        className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm font-mono"
      />
      <button
        onClick={onSend}
        disabled={tab.sending}
        className="px-4 py-1.5 rounded text-sm font-medium bg-primary text-primary-text disabled:opacity-50"
      >
        {tab.sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: request-sub-tabs.tsx**

```tsx
import { useUiStore, type RequestSubTab } from '@/stores/ui-store';

const TABS: { id: RequestSubTab; label: string }[] = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' },
];

export function RequestSubTabs() {
  const active = useUiStore((s) => s.requestSubTab);
  const setActive = useUiStore((s) => s.setRequestSubTab);

  return (
    <div className="flex border-b border-zinc-200">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className={`px-4 py-2 text-sm border-b-2 ${
            active === t.id
              ? 'border-primary text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: body-editor.tsx**

```tsx
import { useTabsStore } from '@/stores/tabs-store';

export function BodyEditor({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  if (!tab) return null;

  return (
    <div className="p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-sm">
        <label className="text-zinc-500">Mode:</label>
        <select
          value={tab.bodyMode ?? ''}
          onChange={(e) => update(tabId, { bodyMode: e.target.value || null, body: e.target.value === 'raw' ? '' : null })}
          className="border border-zinc-300 rounded px-2 py-1"
        >
          <option value="">none</option>
          <option value="raw">raw (JSON / text)</option>
          <option value="urlencoded">urlencoded</option>
        </select>
      </div>
      {tab.bodyMode === 'raw' ? (
        <textarea
          value={typeof tab.body === 'string' ? tab.body : ''}
          onChange={(e) => update(tabId, { body: e.target.value })}
          className="flex-1 border border-zinc-300 rounded p-2 font-mono text-sm"
          placeholder='{"name": "value"}'
          spellCheck={false}
        />
      ) : tab.bodyMode === null ? (
        <p className="text-xs text-zinc-400">No body.</p>
      ) : (
        <p className="text-xs text-zinc-400">{tab.bodyMode} editor not yet implemented.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: auth-editor.tsx**

```tsx
export function AuthEditor() {
  return (
    <div className="p-3 text-sm text-zinc-500">
      Inline auth helpers (Bearer / Basic / API Key) come in Plan 3. For now, set
      <code className="px-1 bg-zinc-100 rounded">Authorization</code> manually in the Headers tab.
    </div>
  );
}
```

- [ ] **Step 5: request-editor.tsx (replace)**

```tsx
import { useTabsStore } from '@/stores/tabs-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useHistoryStore } from '@/stores/history-store';
import { useUiStore } from '@/stores/ui-store';
import { sendRun } from '@/api/runs';
import { ApiError } from '@/api/client';
import { MethodUrlBar } from './method-url-bar';
import { RequestSubTabs } from './request-sub-tabs';
import { KeyValueTable } from './key-value-table';
import { BodyEditor } from './body-editor';
import { AuthEditor } from './auth-editor';

export function RequestEditor({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const update = useTabsStore((s) => s.updateTab);
  const setSending = useTabsStore((s) => s.setSending);
  const setResult = useTabsStore((s) => s.setResult);
  const sub = useUiStore((s) => s.requestSubTab);
  if (!tab) return null;

  const send = async () => {
    setSending(tab.id, true);
    try {
      const envId = useEnvironmentsStore.getState().activeId;
      const res = await sendRun({
        method: tab.method,
        url: tab.url,
        headers: tab.headers,
        params: tab.params,
        body_mode: tab.bodyMode,
        body: tab.body,
        environment_id: envId,
        collection_id: tab.collectionId,
        request_id: tab.requestId,
        request_name: tab.name,
      });
      setResult(tab.id, res.result);
      void useHistoryStore.getState().refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setResult(tab.id, {
          status: null, headers: {}, body: JSON.stringify(e.payload, null, 2),
          body_truncated: false, size_bytes: null, timing_ms: 0,
          error_kind: 'invalid_request', error_message: `HTTP ${e.status}`,
        });
      } else {
        setResult(tab.id, {
          status: null, headers: {}, body: null, body_truncated: false,
          size_bytes: null, timing_ms: 0,
          error_kind: 'unknown', error_message: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setSending(tab.id, false);
    }
  };

  return (
    <section className="border-b border-zinc-200 flex flex-col" style={{ minHeight: '40%' }}>
      <MethodUrlBar tabId={tabId} onSend={send} />
      <RequestSubTabs />
      <div className="flex-1 overflow-auto">
        {sub === 'params' && (
          <KeyValueTable
            rows={tab.params}
            onChange={(params) => update(tab.id, { params })}
            placeholder="Param"
          />
        )}
        {sub === 'headers' && (
          <KeyValueTable
            rows={tab.headers}
            onChange={(headers) => update(tab.id, { headers })}
            placeholder="Header"
          />
        )}
        {sub === 'body' && <BodyEditor tabId={tab.id} />}
        {sub === 'auth' && <AuthEditor />}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Build, then commit**

```bash
cd resources/spa && npm run build
git add resources/spa/src/components/request-editor/
git commit -m "feat(spa): full request editor — method/URL bar, sub tabs, body, auth, send flow"
```

---

## PHASE 7 — Response viewer

### Task 7.1: ResponseStatusBar + ResponseBodyView + ResponseViewer

**Files:**
- Create: `resources/spa/src/components/response-viewer/response-status-bar.tsx`
- Create: `resources/spa/src/components/response-viewer/response-body-view.tsx`
- Modify: `resources/spa/src/components/response-viewer/response-viewer.tsx`

- [ ] **Step 1: response-status-bar.tsx**

```tsx
import type { RunResult } from '@/api/types';

function statusColor(status: number | null) {
  if (status === null) return 'bg-zinc-200 text-zinc-700';
  if (status < 300) return 'bg-emerald-100 text-emerald-800';
  if (status < 400) return 'bg-blue-100 text-blue-800';
  if (status < 500) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ResponseStatusBar({ result }: { result: RunResult | null }) {
  if (!result) return <div className="px-3 py-2 text-xs text-zinc-400">No response yet — hit Send.</div>;

  if (result.error_kind) {
    return (
      <div className="px-3 py-2 flex items-center gap-3 bg-red-50 border-b border-red-200 text-sm">
        <span className="font-semibold text-red-800">{result.error_kind.toUpperCase()}</span>
        <span className="text-red-700">{result.error_message}</span>
        <span className="ml-auto text-xs text-red-600">{result.timing_ms} ms</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 flex items-center gap-3 border-b border-zinc-200 text-sm">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColor(result.status)}`}>
        {result.status ?? '—'}
      </span>
      <span className="text-zinc-600">{result.timing_ms} ms</span>
      <span className="text-zinc-600">{formatSize(result.size_bytes)}</span>
      {result.body_truncated ? (
        <span className="text-amber-600 text-xs">truncated at cap</span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: response-body-view.tsx**

```tsx
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
```

- [ ] **Step 3: response-viewer.tsx (replace stub)**

```tsx
import { useTabsStore } from '@/stores/tabs-store';
import { useUiStore, type ResponseSubTab } from '@/stores/ui-store';
import { ResponseStatusBar } from './response-status-bar';
import { ResponseBodyView } from './response-body-view';

const TABS: { id: ResponseSubTab; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
];

export function ResponseViewer({ tabId }: { tabId: string }) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.id === tabId));
  const sub = useUiStore((s) => s.responseSubTab);
  const setSub = useUiStore((s) => s.setResponseSubTab);
  if (!tab) return null;
  const result = tab.lastResult;

  return (
    <section className="flex-1 flex flex-col min-h-0 border-t border-zinc-200">
      <ResponseStatusBar result={result} />
      <div className="flex border-b border-zinc-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-4 py-1.5 text-xs border-b-2 ${
              sub === t.id ? 'border-primary text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto flex flex-col min-h-0">
        {sub === 'body' && <ResponseBodyView result={result} />}
        {sub === 'headers' && (
          <div className="p-3 text-xs font-mono">
            {result && Object.entries(result.headers).map(([k, v]) => (
              <div key={k}><span className="text-zinc-500">{k}:</span> {v.join(', ')}</div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Build + commit**

```bash
cd resources/spa && npm run build
git add resources/spa/src/components/response-viewer/
git commit -m "feat(spa): ResponseViewer with status bar, body pretty-print, headers tab"
```

---

## PHASE 8 — History list

### Task 8.1: HistoryList sidebar component

**Files:**
- Modify: `resources/spa/src/components/sidebar/history-list.tsx`

- [ ] **Step 1: Replace stub**

```tsx
import { useHistoryStore } from '@/stores/history-store';
import { useTabsStore } from '@/stores/tabs-store';
import { showRun } from '@/api/history';
import type { RunRecordSummary } from '@/api/types';

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-amber-600',
  PUT: 'text-blue-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-red-600',
};

function statusColor(status: number | null) {
  if (status === null) return 'text-red-600';
  if (status < 300) return 'text-emerald-600';
  if (status < 400) return 'text-blue-600';
  if (status < 500) return 'text-amber-600';
  return 'text-red-600';
}

export function HistoryList() {
  const recent = useHistoryStore((s) => s.recent);
  const open = useTabsStore((s) => s.openRequestTab);

  if (recent.length === 0) {
    return <div className="text-xs text-zinc-400 px-3 py-1">No history yet.</div>;
  }

  const onClick = async (run: RunRecordSummary) => {
    const full = await showRun(run.id);
    const payload = (full.request_payload_json ?? {}) as {
      headers?: Array<{ key: string; value: string; disabled?: boolean }>;
      params?: Array<{ key: string; value: string; disabled?: boolean }>;
      body_mode?: string | null;
      body?: unknown;
    };
    open({
      collectionId: full.collection_id,
      requestId: full.request_id,
      name: full.request_name ?? `${full.method} ${full.url_raw}`,
      method: full.method,
      url: full.url_raw,
      headers: payload.headers ?? [],
      params: payload.params ?? [],
      bodyMode: payload.body_mode ?? null,
      body: payload.body ?? null,
    });
  };

  return (
    <ul>
      {recent.map((r) => (
        <li key={r.id}>
          <button
            onClick={() => onClick(r)}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-200 flex items-center gap-2"
          >
            <span className={`text-[10px] font-bold ${METHOD_COLOR[r.method] ?? 'text-zinc-500'}`}>
              {r.method}
            </span>
            <span className={`text-xs ${statusColor(r.response_status)}`}>
              {r.response_status ?? r.error_kind ?? '—'}
            </span>
            <span className="text-zinc-700 truncate">{r.request_name ?? r.url_raw}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
cd resources/spa && npm run build
git add resources/spa/src/components/sidebar/history-list.tsx
git commit -m "feat(spa): HistoryList with method/status badges, click-to-replay"
```

---

## PHASE 9 — Build pipeline + Blade integration

### Task 9.1: Build the SPA and update Blade shell to use the manifest

**Files:**
- Modify: `resources/views/app.blade.php`
- Modify: `src/Http/Controllers/AppController.php`

- [ ] **Step 1: Build the SPA assets**

```bash
cd resources/spa && npm run build
ls -la resources/dist/
```

Expected: `manifest.json` plus `assets/main-[hash].js` and `assets/main-[hash].css`.

- [ ] **Step 2: Modify AppController to read the manifest and pass entries to the view**

`src/Http/Controllers/AppController.php`:
```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class AppController extends Controller
{
    public function show(): Response
    {
        return response()->view('postman-clone::app', [
            'theme' => config('postman-clone.theme'),
            'route_prefix' => config('postman-clone.route.prefix'),
            'manifest' => $this->loadManifest(),
        ]);
    }

    /**
     * @return array{js: string|null, css: array<int,string>}
     */
    protected function loadManifest(): array
    {
        $path = __DIR__ . '/../../../resources/dist/manifest.json';
        if (! is_file($path)) {
            return ['js' => null, 'css' => []];
        }
        $manifest = json_decode(file_get_contents($path), associative: true) ?: [];
        $entry = $manifest['src/main.tsx'] ?? null;
        if (! is_array($entry)) {
            return ['js' => null, 'css' => []];
        }
        return [
            'js' => $entry['file'] ?? null,
            'css' => $entry['css'] ?? [],
        ];
    }
}
```

- [ ] **Step 3: Modify Blade shell to inject the hashed assets**

`resources/views/app.blade.php`:
```blade
<!DOCTYPE html>
<html lang="en" style="--pc-primary: {{ $theme['primary_color'] }}; --pc-primary-text: {{ $theme['primary_text'] }};">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $theme['app_name'] }}</title>
    @if($theme['favicon_url'])<link rel="icon" href="{{ $theme['favicon_url'] }}">@endif
    @foreach($manifest['css'] as $css)
        <link rel="stylesheet" href="/{{ $route_prefix }}/dist/{{ $css }}">
    @endforeach
</head>
<body>
    <div id="app">
        @if(! $manifest['js'])
            <div style="padding:2rem;font-family:system-ui;color:#666">
                SPA bundle not built. Run <code>npm run build</code> in <code>resources/spa/</code>.
            </div>
        @endif
    </div>
    <script>
        window.__POSTMAN_CLONE__ = @json([
            'theme' => $theme,
            'route_prefix' => $route_prefix,
        ]);
    </script>
    @if($manifest['js'])
        <script type="module" src="/{{ $route_prefix }}/dist/{{ $manifest['js'] }}"></script>
    @endif
</body>
</html>
```

- [ ] **Step 4: Add route + middleware bypass for serving static dist assets**

The `dist/` assets need to be served by Laravel since the package mounts under `/postman/`. Add a route in `routes/web.php` (inside the existing group):

```php
// Add inside the Route::group block, BEFORE the api prefix block:
Route::get('/dist/{path}', function (string $path) {
    $file = __DIR__ . '/../resources/dist/' . $path;
    if (! is_file($file)) abort(404);
    $mime = match (pathinfo($file, PATHINFO_EXTENSION)) {
        'js' => 'application/javascript',
        'css' => 'text/css',
        'json' => 'application/json',
        'svg' => 'image/svg+xml',
        default => mime_content_type($file) ?: 'application/octet-stream',
    };
    return response()->file($file, ['Content-Type' => $mime, 'Cache-Control' => 'public, max-age=31536000, immutable']);
})->where('path', '.*');
```

- [ ] **Step 5: Update routes/web.php — full file**

```php
<?php

use HazemHammad\PostmanClone\Http\Controllers\AppController;
use HazemHammad\PostmanClone\Http\Controllers\BootstrapController;
use HazemHammad\PostmanClone\Http\Controllers\CollectionsController;
use HazemHammad\PostmanClone\Http\Controllers\EnvironmentsController;
use HazemHammad\PostmanClone\Http\Controllers\HistoryController;
use HazemHammad\PostmanClone\Http\Controllers\RequestRunnerController;
use Illuminate\Support\Facades\Route;

$prefix = config('postman-clone.route.prefix', 'postman');
$middleware = array_merge(['postman-clone.gate'], config('postman-clone.access.middleware', []));

Route::group([
    'prefix' => $prefix,
    'middleware' => $middleware,
], function (): void {
    Route::get('/dist/{path}', function (string $path) {
        $file = __DIR__ . '/../resources/dist/' . $path;
        if (! is_file($file)) abort(404);
        $mime = match (pathinfo($file, PATHINFO_EXTENSION)) {
            'js' => 'application/javascript',
            'css' => 'text/css',
            'json' => 'application/json',
            'svg' => 'image/svg+xml',
            default => mime_content_type($file) ?: 'application/octet-stream',
        };
        return response()->file($file, ['Content-Type' => $mime, 'Cache-Control' => 'public, max-age=31536000, immutable']);
    })->where('path', '.*');

    Route::get('/', [AppController::class, 'show'])->name('postman-clone.app');
    Route::get('/history', [AppController::class, 'show'])->name('postman-clone.history');

    Route::prefix('api')->group(function (): void {
        Route::get('/bootstrap', [BootstrapController::class, 'show']);
        Route::get('/collections', [CollectionsController::class, 'index']);
        Route::get('/collections/{id}', [CollectionsController::class, 'show'])->where('id', '.*');
        Route::get('/environments', [EnvironmentsController::class, 'index']);
        Route::put('/environments/{env}/variables/{name}', [EnvironmentsController::class, 'updateVariable']);
        Route::delete('/environments/{env}/variables/{name}', [EnvironmentsController::class, 'removeOverride']);
        Route::post('/runs', [RequestRunnerController::class, 'store']);
        Route::post('/preview', [RequestRunnerController::class, 'preview']);
        Route::get('/history', [HistoryController::class, 'index']);
        Route::get('/runs/{id}', [HistoryController::class, 'show']);
        Route::delete('/runs/{id}', [HistoryController::class, 'destroy']);
    });
});
```

- [ ] **Step 6: Run all backend tests to confirm we didn't break anything**

```bash
vendor/bin/pest
```

Expected: 59 passed.

- [ ] **Step 7: Commit**

```bash
git add resources/dist/ resources/views/app.blade.php src/Http/Controllers/AppController.php routes/web.php
git commit -m "feat: build SPA, add manifest reader to AppController, serve dist assets"
```

Note: the `resources/dist/` build artifact IS committed for v0.1 (so consumers don't need a Node build). That's the Telescope/Horizon convention. We'll revisit in Plan 3.

---

## PHASE 10 — Final smoke + checkpoint tag

### Task 10.1: Run the full test suite + tag

- [ ] **Step 1: Run backend tests**

```bash
vendor/bin/pest
```

Expected: 59 passed.

- [ ] **Step 2: Run SPA tests**

```bash
cd resources/spa && npm test
```

Expected: tabsStore + client + KeyValueTable tests pass (~9 tests).

- [ ] **Step 3: PHPStan**

```bash
vendor/bin/phpstan analyse --memory-limit=512M
```

Expected: 0 errors.

- [ ] **Step 4: Tag**

```bash
git tag -a plan-2-spa-demoable -m "Demoable SPA shipped: layout, collection tree, request editor, send flow, response viewer, history. Built dist/ committed. Plan 3 adds Monaco, env-edit UI, install command, dogfood, v0.1 release."
git tag -l 'plan-*'
```

Expected:
```
plan-1-backend-complete
plan-2-spa-demoable
```

---

## Self-review against the spec

| Spec section | Plan 2 task |
|---|---|
| 8.1 Stack | Phase 0 |
| 8.2 Pages | App is the workspace; HistoryPage deferred (sidebar HistoryList covers v0 need) |
| 8.3 Layout | Phase 3 |
| 8.4 Component tree | Phases 3–8 (CommandPalette deferred per spec backlog) |
| 8.5 Stores | Phase 2 |
| 8.6 Monaco | **Deferred to Plan 3** (per re-scope at top) |
| 8.7 `{{var}}` highlighting | **Deferred to Plan 3** |
| 8.8 Theming wiring | Phase 9 (CSS vars come from Blade, mapped in Tailwind config) |
| 8.9 API client | Phase 1 |
| 8.10 Build pipeline | Phase 9 |

**Gaps deferred to Plan 3 (intentional, communicated up-front):**
- Monaco editor (lazy-load, two instances per tab)
- `VariableHighlightedInput` component
- `/api/preview` integration in URL bar
- Environment-editing UI (PUT/DELETE wired through; v0 panel is read-only)
- Auth helpers (Bearer / Basic / API Key) — currently text-tab placeholder
- Install command (`postman-clone:install`) + README + dogfood + v0.1 release

No placeholder issues in tasks. No type drift between phases (`Tab`, `KeyValue`, `RunResult` are consistent across stores, components, API).

---

## Execution Handoff

**Plan 2 saved to `postman-clone/docs/plans/2026-05-02-react-spa-demoable.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.

**2. Inline Execution** — execute in this session with `executing-plans`, checkpoints between phases.

**Which approach?**
