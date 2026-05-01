<?php

use HazemHammad\PostmanClone\Models\Run;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

it('lists history paginated, newest first', function () {
    for ($i = 0; $i < 5; $i++) {
        Run::create([
            'method' => 'GET', 'url_raw' => "x{$i}", 'url_resolved' => "x{$i}",
            'request_payload_json' => [], 'response_body_truncated' => false,
            'created_at' => now()->subSeconds(5 - $i),
        ]);
    }

    $res = $this->getJson('/postman/api/history?per_page=3');
    $res->assertStatus(200);

    expect($res->json('data'))->toHaveCount(3);
    expect($res->json('data.0.url_raw'))->toBe('x4');
    expect($res->json('meta.total'))->toBe(5);
});

it('filters by collection_id and request_id', function () {
    Run::create(['method' => 'GET', 'url_raw' => 'a', 'url_resolved' => 'a',
        'collection_id' => 'col-1', 'request_id' => 'req-1',
        'request_payload_json' => [], 'response_body_truncated' => false]);
    Run::create(['method' => 'GET', 'url_raw' => 'b', 'url_resolved' => 'b',
        'collection_id' => 'col-1', 'request_id' => 'req-2',
        'request_payload_json' => [], 'response_body_truncated' => false]);

    $res = $this->getJson('/postman/api/history?collection_id=col-1&request_id=req-1');
    expect($res->json('data'))->toHaveCount(1);
    expect($res->json('data.0.url_raw'))->toBe('a');
});

it('returns a single run on show', function () {
    $run = Run::create(['method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
        'request_payload_json' => ['headers' => []], 'response_body_truncated' => false]);

    $res = $this->getJson("/postman/api/runs/{$run->id}");
    $res->assertStatus(200);
    expect($res->json('id'))->toBe($run->id);
});

it('returns 404 for unknown run id', function () {
    $this->getJson('/postman/api/runs/999999')->assertStatus(404);
});

it('deletes a single run', function () {
    $run = Run::create(['method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
        'request_payload_json' => [], 'response_body_truncated' => false]);

    $this->deleteJson("/postman/api/runs/{$run->id}")->assertStatus(200);
    expect(Run::find($run->id))->toBeNull();
});
