<?php

use HazemHammad\PostmanClone\Models\Run;

it('persists a run and reads it back', function () {
    $run = Run::create([
        'collection_id' => 'col-1',
        'request_id' => 'req-1',
        'request_name' => 'List items',
        'environment_id' => 'local',
        'method' => 'GET',
        'url_raw' => 'https://api.example.com/{{path}}',
        'url_resolved' => 'https://api.example.com/items',
        'request_payload_json' => ['headers' => ['Accept' => 'application/json']],
        'response_status' => 200,
        'response_headers_json' => ['Content-Type' => 'application/json'],
        'response_body' => '{"ok":true}',
        'response_body_truncated' => false,
        'response_size_bytes' => 11,
        'timing_ms' => 87,
        'error_kind' => null,
        'error_message' => null,
    ]);

    $found = Run::find($run->id);

    expect($found)->not->toBeNull();
    expect($found->method)->toBe('GET');
    expect($found->response_status)->toBe(200);
    expect($found->request_payload_json)->toBe(['headers' => ['Accept' => 'application/json']]);
});
