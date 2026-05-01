<?php

use HazemHammad\PostmanClone\Models\Run;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

it('returns collections, environments, default_environment, and history_count', function () {
    config()->set('postman-clone.collections', [$this->fixturePath('sample-collection.postman_collection.json')]);
    config()->set('postman-clone.environments', [
        'local' => ['base_url' => 'http://localhost:8000'],
    ]);
    config()->set('postman-clone.default_environment', 'local');

    Run::create([
        'method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
        'request_payload_json' => [], 'response_body_truncated' => false,
    ]);

    $res = $this->getJson('/postman/api/bootstrap');

    $res->assertStatus(200);
    $res->assertJsonStructure(['collections', 'environments', 'active_environment', 'history_count']);
    expect($res->json('collections.0.name'))->toBe('Sample API');
    expect($res->json('environments.0.id'))->toBe('local');
    expect($res->json('active_environment'))->toBe('local');
    expect($res->json('history_count'))->toBe(1);
});
