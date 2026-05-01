<?php

use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Execution\ResultDto;
use HazemHammad\PostmanClone\Services\History\HistoryRecorder;

it('writes a Run row with the masked payload and result', function () {
    $recorder = new HistoryRecorder();

    $run = $recorder->record(
        rawPayload: [
            'collection_id' => 'cfg:x', 'request_id' => 'r1', 'request_name' => 'List',
            'environment_id' => 'local',
            'method' => 'GET',
            'url_raw' => '{{base_url}}/items',
            'url_resolved' => 'https://api.test/items',
            'headers' => [['key' => 'Authorization', 'value' => 'Bearer secret-tok']],
            'params' => [], 'body_mode' => null, 'body' => null,
        ],
        secrets: ['secret-tok'],
        result: new ResultDto(
            status: 200,
            headers: ['Content-Type' => ['application/json']],
            body: '{"ok":true}',
            bodyTruncated: false,
            sizeBytes: 11,
            timingMs: 87,
            errorKind: null,
            errorMessage: null,
        ),
    );

    $found = Run::find($run->id);
    expect($found)->not->toBeNull();
    expect($found->method)->toBe('GET');
    expect($found->response_status)->toBe(200);
    expect($found->response_size_bytes)->toBe(11);
    $encoded = json_encode($found->request_payload_json, JSON_UNESCAPED_UNICODE);
    expect($encoded)->not->toContain('secret-tok');
    expect($encoded)->toContain('••••••');
});

it('prunes old rows on every Nth insert', function () {
    config()->set('postman-clone.history.retain_max_rows', 5);
    $recorder = new HistoryRecorder(pruneEvery: 2);

    for ($i = 0; $i < 12; $i++) {
        $recorder->record(
            rawPayload: [
                'method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
                'headers' => [], 'params' => [], 'body_mode' => null, 'body' => null,
            ],
            secrets: [],
            result: new ResultDto(200, [], 'ok', false, 2, 1, null, null),
        );
    }

    expect(Run::count())->toBeLessThanOrEqual(5);
});
