<?php

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Models\Run;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

function bindMockClient(MockHandler $mock): void
{
    app()->instance(Client::class, new Client(['handler' => HandlerStack::create($mock)]));
}

it('executes a simple GET, records history, returns result', function () {
    bindMockClient(new MockHandler([new Response(200, ['Content-Type' => 'application/json'], '{"ok":true}')]));

    $res = $this->postJson('/postman/api/runs', [
        'method' => 'GET',
        'url' => 'https://api.example.com/items',
        'headers' => [],
        'params' => [],
        'body_mode' => null,
        'body' => null,
        'environment_id' => null,
        'collection_id' => null,
        'request_id' => null,
        'request_name' => null,
    ]);

    $res->assertStatus(200);
    expect($res->json('result.status'))->toBe(200);
    expect($res->json('run_id'))->toBeInt();
    expect(Run::count())->toBe(1);
});

it('substitutes environment variables before sending', function () {
    config()->set('postman-clone.environments', ['local' => ['base_url' => 'https://api.example.com']]);

    $captured = null;
    $mock = new MockHandler([
        function ($req) use (&$captured) {
            $captured = (string) $req->getUri();
            return new Response(200, [], 'ok');
        },
    ]);
    bindMockClient($mock);

    $this->postJson('/postman/api/runs', [
        'method' => 'GET',
        'url' => '{{base_url}}/items',
        'headers' => [],
        'params' => [],
        'body_mode' => null, 'body' => null,
        'environment_id' => 'local',
        'collection_id' => null, 'request_id' => null, 'request_name' => null,
    ])->assertStatus(200);

    expect($captured)->toBe('https://api.example.com/items');
});

it('returns 422 with the missing variable list when substitution fails', function () {
    bindMockClient(new MockHandler([new Response(200, [], 'unused')]));

    $res = $this->postJson('/postman/api/runs', [
        'method' => 'GET',
        'url' => '{{nope}}/items',
        'headers' => [], 'params' => [],
        'body_mode' => null, 'body' => null,
        'environment_id' => null,
        'collection_id' => null, 'request_id' => null, 'request_name' => null,
    ]);

    $res->assertStatus(422);
    expect($res->json('error.kind'))->toBe('unresolved_variable');
    expect($res->json('error.missing'))->toBe(['nope']);
});

it('preview endpoint returns substituted url with masked secrets', function () {
    $_SERVER['POSTMAN_CLONE_TEST_TOKEN'] = 'tok-xyz';
    config()->set('postman-clone.environments', [
        'local' => ['token' => 'tok-xyz', 'base_url' => 'http://x'],
    ]);

    $res = $this->postJson('/postman/api/preview', [
        'url' => '{{base_url}}/items?t={{token}}',
        'environment_id' => 'local',
    ]);

    $res->assertStatus(200);
    expect($res->json('url'))->toBe('http://x/items?t=••••••');

    unset($_SERVER['POSTMAN_CLONE_TEST_TOKEN']);
});
