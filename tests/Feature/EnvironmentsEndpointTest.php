<?php

use HazemHammad\PostmanClone\Support\Storage;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
    Storage::ensureDir();
    @unlink(Storage::environmentsOverridePath());
});

it('lists merged environments with per-variable source badges', function () {
    config()->set('postman-clone.environments', [
        'local' => ['base_url' => 'http://x', 'token' => 'cfg-tok'],
    ]);
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'override-tok'],
    ]));

    $res = $this->getJson('/postman/api/environments');
    $res->assertStatus(200);

    $local = collect($res->json('data'))->firstWhere('id', 'local');
    expect($local)->not->toBeNull();
    expect(collect($local['variables'])->firstWhere('name', 'token')['value'])->toBe('override-tok');
    expect(collect($local['variables'])->firstWhere('name', 'token')['source'])->toBe('override');
});

it('writes an override on PUT /environments/{env}/variables/{name}', function () {
    config()->set('postman-clone.environments', ['local' => ['token' => 'cfg']]);

    $res = $this->putJson('/postman/api/environments/local/variables/token', [
        'value' => 'new-value',
    ]);

    $res->assertStatus(200);
    expect($res->json('variable.value'))->toBe('new-value');
    expect($res->json('variable.source'))->toBe('override');

    $stored = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($stored['local']['token'])->toBe('new-value');
});

it('removes an override on DELETE', function () {
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'override-val'],
    ]));
    config()->set('postman-clone.environments', ['local' => ['token' => 'cfg-val']]);

    $res = $this->deleteJson('/postman/api/environments/local/variables/token');
    $res->assertStatus(200);

    $stored = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($stored['local'] ?? [])->toBe([]);
});

it('returns 404 for unknown environment id on PUT', function () {
    config()->set('postman-clone.environments', ['local' => []]);
    $this->putJson('/postman/api/environments/staging/variables/x', ['value' => 'y'])->assertStatus(404);
});

it('validates value is a string', function () {
    config()->set('postman-clone.environments', ['local' => []]);
    $this->putJson('/postman/api/environments/local/variables/x', ['value' => ['nope']])->assertStatus(422);
});
