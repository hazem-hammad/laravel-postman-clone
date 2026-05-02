<?php

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Models\LinkedIssue;
use HazemHammad\PostmanClone\Models\User;
use Illuminate\Support\Facades\Crypt;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

it('counts returns aggregated counts grouped by request', function () {
    LinkedIssue::create(['collection_id' => 'c1', 'request_id' => 'r1', 'issue_number' => 1, 'issue_title' => 'A', 'issue_state' => 'open', 'issue_html_url' => 'u', 'created_by_user_id' => 1]);
    LinkedIssue::create(['collection_id' => 'c1', 'request_id' => 'r1', 'issue_number' => 2, 'issue_title' => 'B', 'issue_state' => 'closed', 'issue_html_url' => 'u', 'created_by_user_id' => 1]);
    LinkedIssue::create(['collection_id' => 'c1', 'request_id' => 'r2', 'issue_number' => 3, 'issue_title' => 'C', 'issue_state' => 'open', 'issue_html_url' => 'u', 'created_by_user_id' => 1]);

    $r = $this->getJson('/postman/api/issues/counts?collection_id=c1');
    $r->assertStatus(200)
        ->assertJsonPath('data.r1.open', 1)
        ->assertJsonPath('data.r1.closed', 1)
        ->assertJsonPath('data.r2.open', 1);
});

it('counts excludes deleted issues', function () {
    LinkedIssue::create(['collection_id' => 'c1', 'request_id' => 'r1', 'issue_number' => 1, 'issue_title' => 'A', 'issue_state' => 'deleted', 'issue_html_url' => 'u', 'created_by_user_id' => 1, 'deleted_at' => now()]);
    expect($this->getJson('/postman/api/issues/counts?collection_id=c1')->json('data'))->toBe([]);
});

it('store creates issue, persists row, returns 201', function () {
    config()->set('postman-clone.github.repo', 'foo/bar');

    $u = User::create([
        'github_id' => 1, 'github_login' => 'h', 'avatar_url' => '',
        'encrypted_access_token' => Crypt::encryptString('tok'),
        'has_repo_access' => true,
    ]);

    $mock = new MockHandler([
        new Response(201, [], json_encode([
            'number' => 99, 'title' => 'T', 'state' => 'open',
            'html_url' => 'https://gh/o/r/issues/99',
            'assignees' => [],
        ])),
    ]);
    $this->app->bind(Client::class, fn () => new Client(['handler' => HandlerStack::create($mock), 'base_uri' => 'https://api.github.com/']));

    $this->withSession(['postman_clone_user_id' => $u->id])
        ->postJson('/postman/api/issues', [
            'collection_id' => 'c', 'request_id' => 'r',
            'title' => 'T', 'body' => 'b', 'idempotency_key' => 'k1',
            'context' => ['collection_name' => 'X', 'request_path' => 'Y', 'method' => 'GET', 'url_raw' => 'u', 'url_resolved' => 'u'],
        ])
        ->assertStatus(201)
        ->assertJsonPath('issue_number', 99);
});

it('store is idempotent on duplicate idempotency_key', function () {
    config()->set('postman-clone.github.repo', 'foo/bar');
    $u = User::create([
        'github_id' => 1, 'github_login' => 'h', 'avatar_url' => '',
        'encrypted_access_token' => Crypt::encryptString('tok'),
        'has_repo_access' => true,
    ]);
    LinkedIssue::create([
        'collection_id' => 'c', 'request_id' => 'r',
        'issue_number' => 7, 'issue_title' => 'X', 'issue_state' => 'open', 'issue_html_url' => 'u',
        'created_by_user_id' => $u->id, 'idempotency_key' => 'kdup',
    ]);

    $resp = $this->withSession(['postman_clone_user_id' => $u->id])
        ->postJson('/postman/api/issues', [
            'collection_id' => 'c', 'request_id' => 'r',
            'title' => 'T', 'body' => 'b', 'idempotency_key' => 'kdup',
            'context' => ['collection_name' => 'X', 'request_path' => 'Y', 'method' => 'GET', 'url_raw' => 'u', 'url_resolved' => 'u'],
        ]);
    $resp->assertStatus(200)->assertJsonPath('issue_number', 7);
});

it('thread returns cached html when within ttl', function () {
    $u = User::create([
        'github_id' => 1, 'github_login' => 'h', 'avatar_url' => '',
        'encrypted_access_token' => Crypt::encryptString('tok'),
        'has_repo_access' => true,
    ]);
    $li = LinkedIssue::create([
        'collection_id' => 'c', 'request_id' => 'r',
        'issue_number' => 1, 'issue_title' => 'T', 'issue_state' => 'open', 'issue_html_url' => 'u',
        'created_by_user_id' => $u->id,
        'thread_html' => '<p>cached</p>', 'thread_fetched_at' => now()->subSeconds(10),
    ]);
    $this->withSession(['postman_clone_user_id' => $u->id])
        ->getJson("/postman/api/issues/{$li->id}/thread")
        ->assertStatus(200)->assertJsonPath('thread_html', '<p>cached</p>');
});

it('thread fetches and caches on cache miss', function () {
    config()->set('postman-clone.github.repo', 'foo/bar');
    $u = User::create([
        'github_id' => 1, 'github_login' => 'h', 'avatar_url' => '',
        'encrypted_access_token' => Crypt::encryptString('tok'),
        'has_repo_access' => true,
    ]);
    $li = LinkedIssue::create([
        'collection_id' => 'c', 'request_id' => 'r',
        'issue_number' => 1, 'issue_title' => 'T', 'issue_state' => 'open', 'issue_html_url' => 'u',
        'created_by_user_id' => $u->id,
    ]);

    $mock = new MockHandler([
        new Response(200, ['ETag' => 'W/"abc"'], json_encode(['state' => 'open', 'title' => 'Updated', 'body_html' => '<p>fresh</p>', 'comments' => 0, 'assignees' => [], 'html_url' => 'u'])),
        new Response(200, [], '[]'),
    ]);
    $this->app->bind(Client::class, fn () => new Client(['handler' => HandlerStack::create($mock), 'base_uri' => 'https://api.github.com/']));

    $this->withSession(['postman_clone_user_id' => $u->id])
        ->getJson("/postman/api/issues/{$li->id}/thread")
        ->assertStatus(200)
        ->assertJsonPath('issue_title', 'Updated')
        ->assertJsonPath('thread_html', '<p>fresh</p>');
});

it('sync-status updates state and handles deleted issues', function () {
    config()->set('postman-clone.github.repo', 'foo/bar');
    $u = User::create([
        'github_id' => 1, 'github_login' => 'h', 'avatar_url' => '',
        'encrypted_access_token' => Crypt::encryptString('tok'),
        'has_repo_access' => true,
    ]);
    $a = LinkedIssue::create(['collection_id' => 'c', 'request_id' => 'r', 'issue_number' => 1, 'issue_title' => 'A', 'issue_state' => 'open', 'issue_html_url' => 'u', 'created_by_user_id' => $u->id]);
    $b = LinkedIssue::create(['collection_id' => 'c', 'request_id' => 'r', 'issue_number' => 2, 'issue_title' => 'B', 'issue_state' => 'open', 'issue_html_url' => 'u', 'created_by_user_id' => $u->id]);

    $mock = new MockHandler([
        new Response(200, [], json_encode(['state' => 'closed', 'title' => 'A', 'comments' => 0, 'assignees' => []])),
        new Response(404, [], '{}'),
    ]);
    $this->app->bind(Client::class, fn () => new Client(['handler' => HandlerStack::create($mock), 'base_uri' => 'https://api.github.com/']));

    $this->withSession(['postman_clone_user_id' => $u->id])
        ->postJson('/postman/api/issues/sync-status', ['linked_issue_ids' => [$a->id, $b->id]])
        ->assertStatus(200)
        ->assertJsonPath("data.{$a->id}.state", 'closed')
        ->assertJsonPath("data.{$b->id}.state", 'deleted');
});
