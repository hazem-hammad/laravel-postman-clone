<?php

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request as Psr7Request;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Services\Execution\RequestExecutor;
use HazemHammad\PostmanClone\Services\Execution\ResultDto;

function makeExecutor(MockHandler $mock, array $config = []): RequestExecutor
{
    $config = array_merge([
        'timeout_seconds' => 30,
        'response_body_cap_mb' => 5,
        'follow_redirects' => true,
        'max_redirects' => 5,
        'verify_tls' => true,
    ], $config);

    $client = new Client(['handler' => HandlerStack::create($mock)]);
    return new RequestExecutor($client, $config);
}

it('executes a successful GET and returns status/headers/body', function () {
    $mock = new MockHandler([
        new Response(200, ['Content-Type' => 'application/json'], '{"ok":true}'),
    ]);
    $exec = makeExecutor($mock);

    $result = $exec->execute([
        'method' => 'GET',
        'url' => 'https://api.example.com/items',
        'headers' => [['key' => 'Accept', 'value' => 'application/json', 'disabled' => false]],
        'params' => [],
        'body_mode' => null,
        'body' => null,
    ]);

    expect($result)->toBeInstanceOf(ResultDto::class);
    expect($result->status)->toBe(200);
    expect($result->body)->toBe('{"ok":true}');
    expect($result->headers['Content-Type'][0])->toBe('application/json');
    expect($result->errorKind)->toBeNull();
});

it('appends query params from the params array', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = (string) $req->getUri();
            return new Response(200, [], 'ok');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'GET',
        'url' => 'https://x.test/items',
        'headers' => [],
        'params' => [
            ['key' => 'limit', 'value' => '10', 'disabled' => false],
            ['key' => 'skip',  'value' => '0',  'disabled' => true],
        ],
        'body_mode' => null,
        'body' => null,
    ]);

    expect($captured)->toBe('https://x.test/items?limit=10');
});

it('reports network error with kind=network on connection failure', function () {
    $mock = new MockHandler([
        new ConnectException('Connection refused', new Psr7Request('GET', 'https://x.test')),
    ]);
    $exec = makeExecutor($mock);

    $result = $exec->execute([
        'method' => 'GET',
        'url' => 'https://x.test',
        'headers' => [], 'params' => [], 'body_mode' => null, 'body' => null,
    ]);

    expect($result->status)->toBeNull();
    expect($result->errorKind)->toBe('network');
});

it('truncates response body at the configured cap', function () {
    $cap = 1024; // 1 KB cap
    $oversized = str_repeat('a', $cap * 2);
    $mock = new MockHandler([new Response(200, [], $oversized)]);
    $exec = makeExecutor($mock, ['response_body_cap_mb' => 1 / 1024]); // 1 KB

    $result = $exec->execute([
        'method' => 'GET', 'url' => 'https://x.test',
        'headers' => [], 'params' => [], 'body_mode' => null, 'body' => null,
    ]);

    expect(strlen($result->body))->toBe($cap);
    expect($result->bodyTruncated)->toBeTrue();
    expect($result->sizeBytes)->toBe($cap * 2);
});

it('sends a raw JSON body when body_mode = raw', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = (string) $req->getBody();
            return new Response(201, [], '');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'POST',
        'url' => 'https://x.test/items',
        'headers' => [['key' => 'Content-Type', 'value' => 'application/json', 'disabled' => false]],
        'params' => [],
        'body_mode' => 'raw',
        'body' => '{"name":"hi"}',
    ]);

    expect($captured)->toBe('{"name":"hi"}');
});

it('auto-injects Content-Type: application/json for raw JSON bodies', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = $req->getHeaderLine('Content-Type');
            return new Response(200, [], '');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'POST',
        'url' => 'https://x.test/items',
        'headers' => [],
        'params' => [],
        'body_mode' => 'raw',
        'body' => '{"signup_token":"abc","name":"Test"}',
    ]);

    expect($captured)->toBe('application/json');
});

it('does not override an explicit Content-Type when body is raw JSON', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = $req->getHeaderLine('Content-Type');
            return new Response(200, [], '');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'POST',
        'url' => 'https://x.test/items',
        'headers' => [['key' => 'content-type', 'value' => 'application/vnd.custom+json', 'disabled' => false]],
        'params' => [],
        'body_mode' => 'raw',
        'body' => '{"name":"hi"}',
    ]);

    expect($captured)->toBe('application/vnd.custom+json');
});

it('does not auto-inject Content-Type for non-JSON raw bodies', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = $req->getHeaderLine('Content-Type');
            return new Response(200, [], '');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'POST',
        'url' => 'https://x.test/items',
        'headers' => [],
        'params' => [],
        'body_mode' => 'raw',
        'body' => 'hello plain text',
    ]);

    expect($captured)->toBe('');
});
