<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use GuzzleHttp\Client;
use HazemHammad\PostmanClone\Http\Requests\CreateIssueRequest;
use HazemHammad\PostmanClone\Http\Requests\SyncStatusRequest;
use HazemHammad\PostmanClone\Models\LinkedIssue;
use HazemHammad\PostmanClone\Services\Github\AssigneeSuggester;
use HazemHammad\PostmanClone\Services\Github\GithubClient;
use HazemHammad\PostmanClone\Services\Github\IssueBodyComposer;
use HazemHammad\PostmanClone\Services\Github\UserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class IssuesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $collectionId = (string) $request->query('collection_id', '');
        $requestId = (string) $request->query('request_id', '');
        if ($collectionId === '') {
            return response()->json(['data' => []]);
        }

        $query = LinkedIssue::query()
            ->where('collection_id', $collectionId)
            ->whereNull('deleted_at')
            ->orderByDesc('id');

        if ($requestId !== '') {
            $query->where('request_id', $requestId);
        }

        return response()->json([
            'data' => $query->get()->map(fn (LinkedIssue $li) => $this->serializeLinkedIssue($li))->all(),
        ]);
    }

    public function counts(Request $request): JsonResponse
    {
        $collectionId = (string) $request->query('collection_id', '');
        if ($collectionId === '') {
            return response()->json(['data' => []]);
        }

        $rows = LinkedIssue::query()
            ->where('collection_id', $collectionId)
            ->whereNull('deleted_at')
            ->get(['request_id', 'issue_state']);

        $out = [];
        foreach ($rows as $row) {
            $out[$row->request_id] ??= ['open' => 0, 'closed' => 0];
            $key = $row->issue_state === 'open' ? 'open' : 'closed';
            $out[$row->request_id][$key]++;
        }

        return response()->json(['data' => $out]);
    }

    public function store(
        CreateIssueRequest $request,
        UserResolver $userResolver,
        IssueBodyComposer $composer,
        Client $http,
    ): JsonResponse {
        $payload = $request->validated();

        $existing = LinkedIssue::where('idempotency_key', $payload['idempotency_key'])->first();
        if ($existing) {
            return response()->json($this->serializeLinkedIssue($existing), 200);
        }

        $repo = config('postman-clone.github.repo');
        if (! $repo) {
            abort(412, 'GitHub repo not configured');
        }

        $user = $userResolver->current();
        $client = new GithubClient($http, $user->getAccessToken());

        $body = $composer->compose([
            'user_body' => $payload['body'],
            'collection_name' => $payload['context']['collection_name'] ?? '',
            'request_path' => $payload['context']['request_path'] ?? '',
            'method' => $payload['context']['method'] ?? 'GET',
            'url_raw' => $payload['context']['url_raw'] ?? '',
            'url_resolved' => $payload['context']['url_resolved'] ?? '',
            'env_id' => $payload['context']['env_id'] ?? null,
            'branch' => $payload['context']['branch'] ?? null,
            'last_run' => $payload['context']['last_run'] ?? null,
            'filer_login' => $user->github_login,
        ]);

        $assignees = ! empty($payload['assignee']) ? [$payload['assignee']] : [];
        $issue = $client->createIssue($repo, $payload['title'], $body, $assignees);

        $linked = LinkedIssue::create([
            'collection_id' => $payload['collection_id'],
            'request_id' => $payload['request_id'],
            'issue_number' => $issue['number'],
            'issue_title' => $issue['title'],
            'issue_state' => $issue['state'],
            'issue_html_url' => $issue['html_url'],
            'assignee_login' => $issue['assignees'][0]['login'] ?? null,
            'created_by_user_id' => $user->id,
            'comment_count' => 0,
            'last_synced_at' => now(),
            'idempotency_key' => $payload['idempotency_key'],
        ]);

        return response()->json($this->serializeLinkedIssue($linked), 201);
    }

    public function thread(int $id, Client $http, UserResolver $userResolver): JsonResponse
    {
        $linked = LinkedIssue::findOrFail($id);
        $ttl = (int) config('postman-clone.github.thread_cache_ttl', 60);
        if ($linked->thread_html !== null && $linked->thread_fetched_at && $linked->thread_fetched_at->isAfter(now()->subSeconds($ttl))) {
            return response()->json($this->serializeThread($linked));
        }

        return $this->fetchAndCacheThread($linked, $http, $userResolver);
    }

    public function refresh(int $id, Client $http, UserResolver $userResolver): JsonResponse
    {
        $linked = LinkedIssue::findOrFail($id);

        return $this->fetchAndCacheThread($linked, $http, $userResolver);
    }

    public function syncStatus(SyncStatusRequest $request, Client $http, UserResolver $userResolver): JsonResponse
    {
        $repo = config('postman-clone.github.repo');
        $user = $userResolver->current();
        $client = new GithubClient($http, $user->getAccessToken());

        $rows = LinkedIssue::whereIn('id', $request->validated()['linked_issue_ids'])->get();
        $out = [];
        foreach ($rows as $li) {
            $r = $client->getIssueStatus($repo, $li->issue_number, $li->thread_etag);
            if ($r['state'] === 'deleted') {
                $li->forceFill([
                    'issue_state' => 'deleted',
                    'deleted_at' => now(),
                    'last_synced_at' => now(),
                ])->save();
            } elseif (! $r['notModified']) {
                $li->forceFill([
                    'issue_state' => $r['state'],
                    'issue_title' => $r['title'],
                    'comment_count' => $r['comment_count'],
                    'assignee_login' => $r['assignee_login'],
                    'thread_etag' => $r['etag'] ?? $li->thread_etag,
                    'last_synced_at' => now(),
                ])->save();
            } else {
                $li->forceFill(['last_synced_at' => now()])->save();
            }
            $out[$li->id] = [
                'state' => $li->issue_state,
                'title' => $li->issue_title,
                'comment_count' => $li->comment_count,
                'assignee_login' => $li->assignee_login,
            ];
        }

        return response()->json(['data' => $out]);
    }

    public function suggestAssignee(Request $request, AssigneeSuggester $suggester, UserResolver $userResolver, Client $http): JsonResponse
    {
        $url = (string) $request->query('url', '');
        $method = (string) $request->query('method', 'GET');
        if ($url === '') {
            return response()->json(['suggested' => null, 'source' => null]);
        }

        $user = $userResolver->current();
        $suggester->setClientFactory(fn () => new GithubClient($http, $user->getAccessToken()));

        $result = $suggester->suggest($method, $url);

        return response()->json($result ?? ['suggested' => null, 'source' => null]);
    }

    public function collaborators(Client $http, UserResolver $userResolver): JsonResponse
    {
        $repo = config('postman-clone.github.repo');
        $user = $userResolver->current();
        $cacheKey = "postman_clone_collaborators_{$repo}";
        $ttl = (int) config('postman-clone.github.collaborators_cache_ttl', 86400);

        $data = Cache::remember($cacheKey, $ttl, function () use ($http, $user, $repo) {
            $client = new GithubClient($http, $user->getAccessToken());

            return $client->listCollaborators($repo);
        });

        return response()->json(['data' => $data]);
    }

    protected function fetchAndCacheThread(LinkedIssue $linked, Client $http, UserResolver $userResolver): JsonResponse
    {
        $repo = config('postman-clone.github.repo');
        $user = $userResolver->current();
        $client = new GithubClient($http, $user->getAccessToken());
        $r = $client->getIssueWithComments($repo, $linked->issue_number, $linked->thread_etag);

        if ($r['notModified']) {
            $linked->forceFill(['thread_fetched_at' => now()])->save();

            return response()->json($this->serializeThread($linked));
        }

        $cap = (int) config('postman-clone.github.thread_html_cap_bytes', 1048576);
        $html = strlen($r['html']) > $cap
            ? '<p><em>Thread too long for inline view — open on GitHub.</em></p>'
            : $r['html'];

        $linked->forceFill([
            'thread_html' => $html,
            'thread_etag' => $r['etag'],
            'thread_fetched_at' => now(),
            'issue_state' => $r['state'],
            'issue_title' => $r['title'],
            'comment_count' => $r['comment_count'],
            'assignee_login' => $r['assignee_login'],
            'last_synced_at' => now(),
        ])->save();

        return response()->json($this->serializeThread($linked));
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeLinkedIssue(LinkedIssue $li): array
    {
        return [
            'id' => $li->id,
            'collection_id' => $li->collection_id,
            'request_id' => $li->request_id,
            'issue_number' => $li->issue_number,
            'issue_title' => $li->issue_title,
            'issue_state' => $li->issue_state,
            'issue_html_url' => $li->issue_html_url,
            'assignee_login' => $li->assignee_login,
            'comment_count' => $li->comment_count,
            'created_at' => $li->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeThread(LinkedIssue $li): array
    {
        return [
            'id' => $li->id,
            'collection_id' => $li->collection_id,
            'request_id' => $li->request_id,
            'issue_number' => $li->issue_number,
            'issue_title' => $li->issue_title,
            'issue_state' => $li->issue_state,
            'issue_html_url' => $li->issue_html_url,
            'assignee_login' => $li->assignee_login,
            'comment_count' => $li->comment_count,
            'thread_html' => $li->thread_html,
            'thread_fetched_at' => $li->thread_fetched_at?->toIso8601String(),
        ];
    }
}
