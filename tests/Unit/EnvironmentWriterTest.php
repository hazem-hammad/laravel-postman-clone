<?php

use HazemHammad\PostmanClone\Services\Environments\EnvironmentWriter;
use HazemHammad\PostmanClone\Support\Storage;

beforeEach(function () {
    Storage::ensureDir();
    @unlink(Storage::environmentsOverridePath());
});

it('creates the override file when none exists and writes a single value', function () {
    (new EnvironmentWriter())->setOverride('local', 'token', 'xyz');

    $data = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($data)->toBe(['local' => ['token' => 'xyz']]);
});

it('preserves existing overrides when adding a new one', function () {
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['user_id' => '42'],
        'staging' => ['token' => 's-tok'],
    ]));

    (new EnvironmentWriter())->setOverride('local', 'token', 'new-tok');

    $data = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($data['local'])->toBe(['user_id' => '42', 'token' => 'new-tok']);
    expect($data['staging'])->toBe(['token' => 's-tok']);
});

it('removes a single override key', function () {
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'tok', 'user_id' => '42'],
    ]));

    (new EnvironmentWriter())->removeOverride('local', 'token');

    $data = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($data['local'])->toBe(['user_id' => '42']);
});
