# Comments & GitHub Issues Integration — Design Spec

- **Date:** 2026-05-02
- **Status:** Approved (brainstorming complete; pending implementation plan)
- **Owner:** Hazem Hamaad
- **Branch:** `feat/comments-and-issues`
- **Builds on:** `postman-clone/docs/specs/2026-05-02-postman-clone-design.md`

---

## 1. Goal

Let developers report issues directly from a Postman Clone request, with the
issue tracked on the consumer project's GitHub repository. Comments live on
GitHub (the team's existing source of truth for discussion) and are mirrored
read-only into the package so devs can see status and replies without
leaving the workspace.

A developer's typical flow:

1. Run a request, observe a problem.
2. Open the new **Comments** sub-tab.
3. Click **File new issue**, type a description.
4. Submit → a GitHub issue is created in the project's repo with full
   request context (URL, method, env, last response, branch) attached, and
   assigned to the implementer of the related route (best-effort) or to a
   configured fallback user.
5. The issue, its comments, and its open/closed status sync back into the
   sub-tab so the dev can track resolution without bouncing to GitHub —
   though replies still happen on GitHub via a "Reply on GitHub" link.

## 2. Non-goals (v1)

Captured in `docs/backlog.md` under "Comments & GitHub integration":

- In-app reply composer (writing comments, file attachments, mention autocomplete, markdown editor).
- Bidirectional comment sync — only read mirroring is supported.
- Issue editing / closing / labeling from inside the SPA.
- Webhook-driven real-time updates (lazy on-tab-activation refresh only).
- Cross-request "all my open issues" dashboard view.
- Notifications / toasts when an issue's status changes.
- GitHub App migration (we use OAuth Apps).
- Multi-repo per package install.
- PAT-based fallback authentication.

## 3. Auth model

### 3.1 OAuth provisioning

Each consumer project registers its own GitHub OAuth App at
`github.com/settings/developers` (or org-level). One-time admin task:

- Set callback URL to `https://<host>/postman/auth/github/callback` for each
  environment the package will run in (one OAuth App per host since OAuth
  Apps don't support multiple callback URLs — local, staging, prod each get
  their own).
- Copy `Client ID` and `Client Secret` into the consumer's `.env`.

We deliberately use OAuth Apps rather than GitHub Apps. We don't need
elevated permissions, don't want webhook setup burden, and OAuth Apps are
simpler for both the package and the consumer.

### 3.2 Configuration

```env
POSTMAN_CLONE_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
POSTMAN_CLONE_GITHUB_CLIENT_SECRET=<secret>
POSTMAN_CLONE_GITHUB_REPO=hazem-hammad/ticketscape-backend
POSTMAN_CLONE_GITHUB_DEFAULT_ASSIGNEE=hazem-hammad
POSTMAN_CLONE_GITHUB_ALLOW_PUBLIC_REPO_SCOPE=false
```

```php
// config/postman-clone.php
'github' => [
    'enabled' => env('POSTMAN_CLONE_GITHUB_CLIENT_ID') !== null,
    'client_id' => env('POSTMAN_CLONE_GITHUB_CLIENT_ID'),
    'client_secret' => env('POSTMAN_CLONE_GITHUB_CLIENT_SECRET'),
    'repo' => env('POSTMAN_CLONE_GITHUB_REPO'),
    // null → auto-detect from `git remote get-url origin` of the host project
    'default_assignee' => env('POSTMAN_CLONE_GITHUB_DEFAULT_ASSIGNEE'),
    'allow_public_repo_scope' => env('POSTMAN_CLONE_GITHUB_ALLOW_PUBLIC_REPO_SCOPE', false),
    'oauth_state_ttl' => 600, // seconds; OAuth state nonce expiry
    'thread_cache_ttl' => 60, // seconds; min interval between thread fetches
    'collaborators_cache_ttl' => 86400, // seconds; daily refresh
    'repo_access_recheck_interval' => 86400, // seconds; user.has_repo_access TTL
],
```

When `github.enabled` is false (no client id configured), the entire feature
is hidden from the UI; the package runs in pure local mode (today's
behavior). Graceful degradation.

### 3.3 OAuth scopes

By default we request:

- `read:user` — display name, login, email
- `repo` — read + write issues on private repos

When `allow_public_repo_scope` is true, request `public_repo` instead.
Useful for projects whose repo is genuinely public.

### 3.4 Repo identity resolution

`RepoIdentityResolver` service resolves "the project's repo" in priority
order:

1. `config('postman-clone.github.repo')` if set.
2. Auto-detect from `git remote get-url origin` of the host project's
   `base_path()`. Parse the URL to extract `owner/name`. Supports both
   `git@github.com:o/n.git` and `https://github.com/o/n.git`.
3. If neither resolves: feature stays disabled even if a client_id is
   configured. Bootstrap returns `github.repo: null`.

### 3.5 Repo access gate

On first sign-in (and every 24 h afterward via
`repo_access_recheck_interval`), the backend calls
`GET /repos/{owner}/{repo}` with the user's access token.

- 200 → `users.has_repo_access = true`. Comments features unlocked.
- 404 / 403 → `has_repo_access = false`. Comments features locked behind a
  "no access" page.
- Network / 5xx → don't update the flag; carry forward the previous value.

### 3.6 Authentication is optional

Existing endpoints (`/api/runs`, `/api/collections`, `/api/environments`,
`/api/history`, etc.) do not require GitHub auth. The package keeps
working in pure local mode for users who don't sign in or who don't have
repo access. Sign-in unlocks comments only — it doesn't gatekeep the
existing workspace.

## 4. Data model

Two new tables on the existing `postman_clone_storage` connection. Both
backed by the SQLite-default-or-consumer-DB driver established in the v1
spec — no new infrastructure.

### 4.1 `postman_clone_users`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint pk | |
| `github_id` | bigint, unique | the GitHub user's numeric id (stable; survives username changes) |
| `github_login` | string | username, e.g. `hazem-hammad` |
| `name` | string, nullable | display name from `/user` |
| `email` | string, nullable | from `/user/emails` — used for the implementer-detection email→login cache |
| `avatar_url` | string | shown on comment threads + assignee dropdown |
| `encrypted_access_token` | text | `Crypt::encrypt($oauthToken)` |
| `has_repo_access` | bool | result of the most recent `/repos/{owner}/{repo}` check |
| `last_repo_check_at` | timestamp | recheck every 24 h |
| `last_seen_at` | timestamp | for any future "active users" UI |
| `created_at`, `updated_at` | timestamps | |

Indexes: unique on `github_id`. Index on `email` for the
implementer-detection lookup.

### 4.2 `postman_clone_linked_issues`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint pk | |
| `collection_id` | string | matches the v1 spec's parser-stable IDs |
| `request_id` | string | which request inside the collection |
| `issue_number` | int | GitHub issue number |
| `issue_title` | string | cached for badge / sub-tab list |
| `issue_state` | string | `open` / `closed` / `deleted` |
| `issue_html_url` | string | cached so we don't recompute on every render |
| `assignee_login` | string, nullable | cached for badge tooltip |
| `created_by_user_id` | bigint fk → `postman_clone_users.id` | who filed it from our UI |
| `comment_count` | int | cached for sub-tab count badge |
| `thread_html` | longtext, nullable | the full issue body + comments rendered HTML from GitHub's `application/vnd.github.html+json`. NULL until the user first opens the thread |
| `thread_etag` | string, nullable | `If-None-Match` value for conditional GETs — a 304 doesn't count against rate limits |
| `thread_fetched_at` | timestamp, nullable | for "Last refreshed Xs ago" + TTL gating |
| `last_synced_at` | timestamp | last status check |
| `idempotency_key` | string, nullable, unique | UUID per composer-submit; prevents duplicate issues on network retries |
| `deleted_at` | timestamp, nullable | set when GitHub returns 404 on sync — soft-delete |
| `created_at`, `updated_at` | timestamps | |

Indexes:
- `(collection_id, request_id)` — primary read path for badge counts and sub-tab content.
- `(issue_number)` — secondary index for any future webhook handler.
- unique on `idempotency_key` where not null.

### 4.3 Sizing decisions

- One row per linked issue, **not per comment**. The thread (issue body + N
  comments) is materialized as a single HTML blob from GitHub. Saves us
  from reimplementing comment rendering and makes "refresh" a single
  write.
- `thread_html` capped at 1 MB. Threads over the cap store a placeholder +
  the issue HTML URL; the SPA shows "Thread too long for inline view —
  open on GitHub".
- No `comment_drafts` table. Drafts live in component state. If you
  refresh the browser mid-typing, you lose the draft.

## 5. HTTP API

All new endpoints sit under `/postman/...` and inherit the existing
`postman-clone.gate` middleware (env check + optional Gate). Auth-required
endpoints add `EnsureGithubAuthenticated` on top.

### 5.1 Auth

| Method · Path | Handler | Auth | Notes |
|---|---|---|---|
| `GET /postman/auth/github/start` | `AuthController@start` | none | generates state nonce, stores in session, redirects to GitHub authorize URL |
| `GET /postman/auth/github/callback` | `AuthController@callback` | none | validates state, exchanges code → token, fetches profile + repo gate, upserts user, sets session, redirects to `/postman/` |
| `POST /postman/auth/sign-out` | `AuthController@signOut` | required | clears `postman_clone_user_id` from session; returns 204 |
| `GET /postman/api/me` | `MeController@show` | required | returns `{ id, github_login, name, avatar_url, has_repo_access }` |

### 5.2 Issues

| Method · Path | Auth | Notes |
|---|---|---|
| `GET /postman/api/issues/counts?collection_id=…` | optional | returns `{"<request_id>": {"open": 2, "closed": 1}, …}`. Reads from `linked_issues` only — no GitHub calls. Public so badges render before sign-in. |
| `POST /postman/api/issues` | required | body: `{collection_id, request_id, title, body, assignee, idempotency_key}`. Composes templated body, hits GitHub, persists row. Returns the linked_issue. |
| `GET /postman/api/issues/{id}/thread` | required | returns rendered HTML + metadata; uses cached `thread_html` if `thread_fetched_at < thread_cache_ttl`, else fetches with ETag. |
| `POST /postman/api/issues/{id}/refresh` | required | force-fetches even if cache is fresh. |
| `POST /postman/api/issues/sync-status` | required | body: `{linked_issue_ids: number[]}`. Parallel fetches with ETags, returns per-id `state + title + assignee + comment_count`. |
| `GET /postman/api/issues/suggest-assignee?request_id=…` | required | runs the route-file → git-log → email-lookup chain. Returns `{suggested: login \| null, source}`. |
| `GET /postman/api/issues/collaborators` | required | cached for `collaborators_cache_ttl`. `GET /repos/{o}/{r}/collaborators` (paginated). |

### 5.3 Bootstrap delta

Existing `/api/bootstrap` response gains:

```json
{
  "github": {
    "enabled": true,
    "repo": "hazem-hammad/ticketscape-backend",
    "current_user": {
      "id": 123,
      "github_login": "hazem-hammad",
      "name": "Hazem Hamaad",
      "avatar_url": "https://avatars…",
      "has_repo_access": true
    }
  }
}
```

`github.enabled = false` when `client_id` is missing — SPA hides all
comments UI.
`github.current_user = null` when no session — SPA shows the "Sign in with
GitHub" CTA.

### 5.4 `EnsureGithubAuthenticated` middleware

1. Read `postman_clone_user_id` from session. If missing → 401 `{error: "unauthenticated"}`.
2. Load the user. If `has_repo_access === false` → 403 `{error: "no_repo_access"}`.
3. If `last_repo_check_at < now - repo_access_recheck_interval` → fire-and-forget background recheck (don't block the request).

## 6. Backend services

The feature is layered into thin services in `src/Services/Github/`:

- **`GithubClient`** — Guzzle-based REST wrapper. One method per endpoint
  we touch (`getRepo`, `createIssue`, `getIssueWithComments`,
  `listCollaborators`, `searchUserByEmail`, `exchangeOauthCode`,
  `getAuthenticatedUser`). Takes a Bearer token in the constructor. Handles
  ETag passthrough and 304 → null mapping. Redacts the `Authorization`
  header in any logged exceptions.

- **`RepoIdentityResolver`** — config override → git-remote auto-detection
  → null. Returns `'owner/name'` or null.

- **`AssigneeSuggester`** — encapsulates the
  route-file → git-log → email-lookup chain. Public method:
  `suggest(string $requestUrl, string $method): ?array` returning
  `{login, source}` or null. Lookups: parses `routes/api.php` for the
  matching route → reflects to the controller class → reads the file path
  → shells out to `git log -n 5 --pretty=format:"%ae|%an" -- <file>` for
  unique authors → looks up each in `postman_clone_users.email` cache or
  `searchUserByEmail`. Caches misses too (with a TTL) to avoid re-querying
  for unmappable authors.

- **`IssueBodyComposer`** — generates the templated issue body. Takes the
  user's text + request + last-run + active env + branch and produces
  markdown.

- **`OAuthStateGenerator`** — random state nonce (32 bytes hex) stored in
  session under `postman_clone_oauth_state` with `oauth_state_ttl`. Used
  for CSRF protection on the OAuth round-trip.

- **`UserResolver`** — resolves the current user from session. Loads the
  user, decrypts the access token, returns a value object with
  `($user, $accessToken)`. Used inside `EnsureGithubAuthenticated` to
  build a `GithubClient` per request.

## 7. Frontend (SPA)

### 7.1 New stores

`stores/auth-store.ts`:

```ts
type State = {
  user: { id, githubLogin, name, avatarUrl, hasRepoAccess } | null;
  githubEnabled: boolean;
  githubRepo: string | null;
  setUser, setEnabled, setRepo, signOut: actions
};
```

Populated from the bootstrap response. Not persisted — re-read on every
boot from `/api/me`.

`stores/linked-issues-store.ts`:

```ts
type LinkedIssue = {
  id: number; collectionId: string; requestId: string;
  issueNumber: number; issueTitle: string;
  issueState: 'open' | 'closed' | 'deleted'; issueHtmlUrl: string;
  assigneeLogin: string | null; commentCount: number;
  createdByLogin: string;
  threadHtml: string | null; threadFetchedAt: number | null;
};

type State = {
  byKey: Record<string, LinkedIssue[]>;
  loadCounts(collectionId: string): Promise<void>;
  ensureThread(linkedIssueId: number): Promise<string>;
  refreshThread(linkedIssueId: number): Promise<string>;
  createIssue(input): Promise<LinkedIssue>;
  syncStatusFor(requestId: string): Promise<void>;
};
```

`byKey` keyed by `${collectionId}::${requestId}`. Populated lazily — the
bootstrap effect fires `loadCounts` for visible collections; the active
RequestEditor calls `syncStatusFor` 60s-debounced when its tab activates.

### 7.2 New API modules

- `api/auth.ts` — `signInUrl()`, `signOut()`, `getMe()`.
- `api/issues.ts` — `getCounts`, `createIssue`, `getThread`,
  `refreshThread`, `syncStatus`, `suggestAssignee`, `getCollaborators`
  (with localStorage daily cache layer).

### 7.3 Component tree

```
<App>
├── <TopBar>
│   └── <UserMenu>                    ← new; sign-in button OR avatar+menu
└── <Workspace>
    ├── <TabsBar>                     ← updated: dot on tabs with open issues
    └── <RequestEditor>
        ├── <RequestSubTabs>          ← updated: 5th tab "Comments" with count
        └── <CommentsPane>            ← new; visible when subTab === 'comments'
            ├── <IssueComposer>       ← new; title, markdown body, assignee dropdown
            └── <IssueThreadList>     ← new; one card per linked issue
                └── <IssueThread>     ← new; expand → renders sanitized HTML
```

### 7.4 Visual surfaces

- **Top bar:** unauthenticated users see "Sign in with GitHub" button next
  to `Manage env`. Authenticated users see a 24×24 avatar with a hover
  menu showing name, login, and "Sign out".
- **Collection tree:** request rows with at least one open issue get a
  small red dot next to the method label. Hover → tooltip "2 open issues".
- **Tabs row:** active tab gets the same red dot when its request has open
  issues.
- **Sub-tabs:** the **Comments** tab is hidden when unauthenticated. When
  visible, it shows a count badge `Comments (3)` if any issues exist for
  the active request, plus the existing accent dot when the user is
  authoring a draft in the composer.
- **Comments sub-tab content:**
  - Header bar: `[+ File new issue]` left, `[Refresh status]` right.
  - List: one collapsed issue card per linked issue, sorted by
    `created_at DESC`. Each card shows state (●/✓), filer login, age,
    comment count, title.
  - Click a card to expand → renders `thread_html` (sanitized) + footer
    with "Last refreshed" + "Refresh" + "Reply on GitHub →".

### 7.5 Issue composer

A slide-down panel above the issue list when "+ File new issue" is
clicked:

- Title input (default: `Issue with <request name>`).
- Markdown body textarea (plain monospace; no syntax highlighting).
- Assignee dropdown with three states:
  1. "Detecting suggested assignee…" while `suggestAssignee` resolves.
  2. On result: pre-selects the suggestion with `(suggested from recent
     commits to <file>)` hint.
  3. On null result or `false`: pre-selects `github.default_assignee`.
  Dropdown opens to a searchable list of repo collaborators. User can
  override at any point.
- Submit + Cancel. Submit posts to `/issues` with an `idempotency_key`
  UUID; on 201 the composer closes and the new issue card appears at the
  top of the list with optimistic state.

### 7.6 Issue thread rendering

`thread_html` is dangerouslySetInnerHTML'd inside a DOMPurify-sanitized
div. Sanitizer config:

- Allowed tags: `a, code, pre, blockquote, table, thead, tbody, tr, td,
  th, img, em, strong, ul, ol, li, h1-h6, p, hr, br, span, div, del`.
- Allowed attributes: `href, src, alt, title, class, lang`.
- Allowed classes (regex): `^(highlight|highlight-source-.+|task-list-item|user-mention|.+-color-fg-default|.+-color-fg-muted)$`.
- All `<a href="…">` rewritten with `target="_blank" rel="noopener noreferrer"`.

**Defense in depth:** GitHub server-renders the HTML and applies its own
sanitization; we re-sanitize on read. We don't trust either layer alone.

## 8. Data flow scenarios

### 8.1 First sign-in

```
SPA: user lands on /postman, no session cookie → "Sign in with GitHub" CTA
SPA → click "Sign in with GitHub"
  → window.location = GET /postman/auth/github/start
  → AuthController: state = bin2hex(random_bytes(16));
                    session(['postman_clone_oauth_state' => state]);
                    redirect to:
     https://github.com/login/oauth/authorize
       ?client_id=…&scope=read:user repo&state=…&redirect_uri=…/postman/auth/github/callback
  → user approves on github.com
  → GitHub redirects to /postman/auth/github/callback?code=…&state=…
  → AuthController validates state matches session, exchanges code:
       POST https://github.com/login/oauth/access_token
  → fetch GET https://api.github.com/user (Bearer access_token)
  → fetch GET https://api.github.com/repos/{owner}/{repo} (gate)
       200 → has_repo_access = true
       404/403 → has_repo_access = false; render "no access" page
  → upsert into postman_clone_users by github_id
  → write encrypted_access_token = Crypt::encrypt($accessToken)
  → set session: postman_clone_user_id = <users.id>
  → redirect to /postman → SPA loads authenticated
```

### 8.2 Browsing with badges (no thread fetch)

```
SPA boot: /api/bootstrap returns github.{enabled, repo, current_user}
SPA: when a collection expands, fires GET /api/issues/counts?collection_id=…
  → reads only postman_clone_linked_issues; no GitHub calls
  → SPA renders red dot per request that has open issues
```

### 8.3 Filing a new issue

```
SPA: Comments sub-tab → "File new issue" → composer opens
SPA → GET /api/issues/suggest-assignee?request_id=…
  backend:
    - parse routes/api.php for matching route
    - resolve to controller class file
    - shell `git log -n 5 --pretty=format:"%ae|%an" -- <file>`
    - for each unique email, query postman_clone_users.email
    - cache miss → GET /search/users?q=<email>+in:email; first hit wins
    - return {suggested: "hazem-hammad", source: "git+github"} or null
SPA: composer renders with suggestion pre-selected (or default_assignee)

User types title + body, picks assignee (or accepts), clicks Submit
SPA → POST /api/issues
       { collection_id, request_id, title, body, assignee, idempotency_key }
  → IssuesController@store
    1. Resolve UserResolver → ($user, $accessToken)
    2. Compose issue body via IssueBodyComposer:
        <user's body>

        ---
        ### Request context
        - **Collection:** Ticket Scape API
        - **Path:** Auth / Email Start
        - **Method + URL:** POST {{base_url}}/api/v1/auth/email/start
        - **Resolved URL:** http://ticketscape.test/api/v1/auth/email/start
        - **Active env:** local
        - **Branch:** feat/auth-flow
        - **Last response:** 401 Invalid or missing API key (37 ms)

        ---
        > Filed via Postman Clone by @hazem-hammad
    3. Check idempotency_key — if already used, return existing linked_issue
    4. POST https://api.github.com/repos/{o}/{r}/issues
        { title, body, assignees: [<assignee>] }
    5. Insert linked_issues row with returned issue_number, state='open'
    6. Return linked_issue to SPA
SPA: linkedIssuesStore prepends the new issue, composer closes, badge increments
```

### 8.4 Reading the thread

```
SPA: user clicks an issue card → linkedIssuesStore.ensureThread(id)
  → if thread_fetched_at < thread_cache_ttl ago AND thread_html exists:
      render from cache
  → else: GET /api/issues/{id}/thread
      backend:
        GET /repos/{o}/{r}/issues/{n}
          Accept: application/vnd.github.html+json
          If-None-Match: <stored thread_etag if any>
        304 → keep cached thread_html; bump thread_fetched_at
        200 → store body_html
        GET .../issues/{n}/comments  Accept: application/vnd.github.html+json
        concatenate body_html + comments → store, save etag
        update issue_state, issue_title, comment_count, assignee_login
      → return rendered HTML + metadata
SPA: DOMPurify(html) → dangerouslySetInnerHTML inside the card body
```

### 8.5 Manual refresh

```
SPA: user clicks "Refresh" → POST /api/issues/{id}/refresh
  → backend re-fetches with stored ETag, updates row if changed
  → returns the (possibly unchanged) thread + metadata
SPA: replaces rendered HTML in place
```

### 8.6 Bulk status sync on tab activation

```
SPA: when a request tab becomes active and any of its issues' last_synced_at
     are older than 60s:
  → POST /api/issues/sync-status
       { linked_issue_ids: [12, 13, 14] }
       backend issues parallel:
         GET /repos/{o}/{r}/issues/{n}
            Accept: application/vnd.github.full+json (no html — smaller)
            If-None-Match: <stored etag>
         304 → bump last_synced_at, no row change
         200 → update issue_state, issue_title, assignee_login, comment_count
         404 → mark deleted_at, issue_state='deleted'
       → return per-id summary
SPA: updates badges; deleted issues hidden with a "1 issue removed on
     GitHub" footer link to show them
```

## 9. Edge cases & failure modes

| Case | Behavior |
|---|---|
| GitHub API 5xx during issue creation | 503 → SPA toast: "GitHub temporarily unavailable. Try again." Composer stays open with text intact. |
| GitHub API 422 (e.g., assignee not a collaborator) | 422 surfaced inline below the assignee dropdown: "Cannot assign to @user — not a repo collaborator." |
| OAuth callback hits with mismatched state | 400 + "Sign-in failed (CSRF). Try again." Logs the attempt for audit. |
| OAuth callback succeeds but `/repos/…` returns 404 | "You don't have access to this project's repo." page with Sign Out link. Session established but `has_repo_access = false`. |
| Repo access revoked between sessions | Next 24-h recheck flips `has_repo_access` to false. The 401/403 from `/issues/*` carries `error: "no_repo_access"`; SPA re-renders the gate page mid-session. |
| Token revoked from GitHub (user revokes app authorization) | Next API call returns 401 → backend clears `encrypted_access_token`, returns `error: "token_revoked"` → SPA signs out + redirects to sign-in. |
| Rate limit hit (5,000/hr) | All issue endpoints return 503 with `Retry-After` from GitHub. SPA shows "GitHub rate limit reached" banner. Cached `linked_issues` still readable. |
| Offline / GitHub unreachable | Same path as 5xx — graceful fallback to cached data with a banner. |
| Issue deleted on GitHub | Sync returns 404 → row marked `issue_state = 'deleted'` + `deleted_at`. SPA hides deleted issues; footer link shows them. |
| Duplicate submission (network retry / double-click) | `idempotency_key` UUID per composer-submit; backend stores `(idempotency_key, linked_issue_id)` for 24 h; replays return original linked_issue. |
| HTML body contains malicious content | DOMPurify on read; rely on GitHub server-rendering for write. Defense in depth. |
| Comment thread > 1 MB rendered | Backend caps `thread_html` at 1 MB; placeholder + link to GitHub. |
| `routes/api.php` not found / unparseable | `suggestAssignee` returns null. SPA defaults to `default_assignee`. No error surfaced. |
| `git log` fails (not a git repo, no commits) | Same — fall through to default assignee. |
| `search/users?q=email` no match | Same. |
| Multiple devs file the same issue | Each is a separate GitHub issue. Sub-tab shows both. GitHub's "duplicate" labeling can be applied on github.com — we don't try to detect. |

## 10. Security

- **Token storage:** Laravel `Crypt::encrypt` (AES-256-CBC + HMAC-SHA256, app-key gated). Tokens never leave the backend — SPA only sees the user's profile.
- **Session handling:** stock Laravel session; `postman_clone_user_id` is the only thing stored.
- **CSRF on issue creation:** Laravel session middleware (already enabled). OAuth `state` param defends the sign-in round-trip.
- **HTML injection:** DOMPurify on read; GitHub server-rendering on write.
- **SSRF:** Composer only sends user-typed text + auto-generated context. No URL fetching from user-supplied data.
- **Token logging:** none. `GithubClient` redacts `Authorization` header in any logged exceptions.
- **Audit trail:** `last_seen_at`, `created_by_user_id`, `last_repo_check_at`. Enough to retrace any access.

## 11. Testing

### 11.1 Unit (PHP / Pest)

| Target | Focus |
|---|---|
| `GithubClientTest` | Mock Guzzle handler. Correct headers (Bearer, Accept), paths, ETag passthrough, 304 mapping, 401 token-revocation handling. |
| `AssigneeSuggesterTest` | Fixture `routes/api.php`. Mocked `GitLogReader` interface (swappable shell-out). Mocked `GithubClient::searchUserByEmail`. Cases: matching route → known author → known login; unmatchable route → null; multiple authors → most-recent wins. |
| `IssueBodyComposerTest` | Golden-file assertions for representative templated bodies (with secrets, with active env, with last response, without). |
| `OAuthStateGeneratorTest` | Nonce length, replay detection (used → invalidated). |
| `RepoIdentityResolverTest` | Config override > git remote > null. URL parsing for `git@…:o/n.git` and `https://…/o/n.git`. |

### 11.2 Feature (PHP / Pest + Testbench)

| Target | Focus |
|---|---|
| `AuthFlowTest` | Start → callback (mocked GitHub) → user upserted → session set → repo gate hit. Mismatched state → 400. Repo gate 404 → has_repo_access = false. |
| `IssuesEndpointTest` | Counts (empty + populated). Create (mock GitHub 201, row inserted, idempotency on retry). Thread (cache hit, miss, ETag 304). Sync-status (parallel updates, deleted handling). Suggest-assignee with stub `AssigneeSuggester`. |
| `EnsureGithubAuthenticatedTest` | 401 without session, 403 without repo access, pass-through with both. Background recheck doesn't block. |
| `BootstrapEndpointTest` | Returns `github` block with `enabled` true/false, `current_user` null/object, `repo` null/string. |

### 11.3 SPA (Vitest)

| Target | Focus |
|---|---|
| `linked-issues-store.test.ts` | `loadCounts`, `ensureThread` cache hit, `refreshThread`, optimistic `createIssue`. |
| `auth-store.test.ts` | sign-in / sign-out state transitions. |
| `IssueComposer.test.tsx` | Form validation: empty title prevented. Assignee dropdown loads suggestion. |
| `UserMenu.test.tsx` | Renders sign-in vs avatar based on store. |
| `dompurify-integration.test.ts` | Render thread with `<script>` and `<img onerror>` → assert sanitized. |

### 11.4 No E2E for v1

OAuth is mocked end-to-end in feature tests. A live Playwright run against
real GitHub is flaky and requires dummy creds — defer until needed.

## 12. Implementation order

This is a phased plan to be expanded into a writing-plans output:

1. **Backend foundation:** config, migrations, `GithubClient`,
   `RepoIdentityResolver`, OAuth flow (start + callback + signout + me).
2. **Repo access gate + middleware:** `EnsureGithubAuthenticated`, repo
   gate check, bootstrap delta.
3. **Issue creation path:** `IssueBodyComposer`, `AssigneeSuggester`,
   `POST /issues`, `linked_issues` migration, idempotency.
4. **Thread reading:** `GET /thread`, `POST /refresh`, ETag handling,
   `POST /sync-status`.
5. **Assignee suggestion + collaborators endpoint:** the routes-file
   parser, git log reader, search/users cache.
6. **SPA auth:** `auth-store`, `UserMenu`, sign-in panel, bootstrap wiring.
7. **SPA comments sub-tab:** `linked-issues-store`, `CommentsPane`,
   `IssueComposer`, `IssueThreadList`, `IssueThread`, DOMPurify wiring.
8. **SPA badges:** dots in CollectionTree + TabsBar; counts on Comments
   sub-tab.
9. **Polish + dogfood:** rate-limit banner, deleted-issue handling, "no
   access" page.

## 13. Backlog

Captured in `docs/backlog.md` under "Comments & GitHub integration":

- In-app reply composer (markdown editor, mentions, attachments).
- Webhook-driven status sync (requires public callback URL).
- Issue editing / closing / labeling from inside the SPA.
- Cross-request "all my open issues" dashboard.
- Notifications / toasts for status changes.
- GitHub App migration (vs OAuth App).
- Multi-repo per package install.
- PAT-based fallback authentication for environments where OAuth isn't feasible (CI smoke, locked-down corp networks).
- Per-user comment preferences (mute, hide).
- Linking a specific run (not just the request) to an issue.
- SSE / WebSocket real-time sync.
