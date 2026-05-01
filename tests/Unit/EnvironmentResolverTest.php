<?php

use HazemHammad\PostmanClone\Services\Environments\EnvironmentResolver;
use HazemHammad\PostmanClone\Support\Storage;

beforeEach(function () {
    Storage::ensureDir();
    @unlink(Storage::environmentsOverridePath());
});

it('returns empty array when env id is null', function () {
    $vars = (new EnvironmentResolver())->resolve(null);
    expect($vars)->toBe([]);
});

it('returns variables from config when no override file exists', function () {
    config()->set('postman-clone.environments', [
        'local' => [
            'base_url' => 'http://localhost:8000',
            'token' => 'abc',
        ],
    ]);

    $vars = (new EnvironmentResolver())->resolve('local');

    expect($vars)->toHaveKey('base_url');
    expect($vars['base_url']['value'])->toBe('http://localhost:8000');
    expect($vars['base_url']['source'])->toBe('config');
});

it('overlays override JSON values on top of config', function () {
    config()->set('postman-clone.environments', [
        'local' => ['token' => 'config-token'],
    ]);
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'override-token'],
    ]));

    $vars = (new EnvironmentResolver())->resolve('local');

    expect($vars['token']['value'])->toBe('override-token');
    expect($vars['token']['source'])->toBe('override');
});

it('marks env() values as secret', function () {
    $_SERVER['POSTMAN_CLONE_TEST_TOKEN'] = 'secret-from-env';
    config()->set('postman-clone.environments', [
        'local' => ['token' => 'secret-from-env'],
    ]);

    $vars = (new EnvironmentResolver())->resolve('local');

    expect($vars['token']['is_secret'])->toBeTrue();
    unset($_SERVER['POSTMAN_CLONE_TEST_TOKEN']);
});

it('overlays collection variables when provided, lowest precedence', function () {
    config()->set('postman-clone.environments', [
        'local' => ['token' => 'env-token'],
    ]);

    $vars = (new EnvironmentResolver())->resolve('local', collectionVariables: [
        'base_url' => 'https://collection-default.test',
        'token' => 'collection-token',
    ]);

    expect($vars['token']['value'])->toBe('env-token');
    expect($vars['token']['source'])->toBe('config');
    expect($vars['base_url']['value'])->toBe('https://collection-default.test');
    expect($vars['base_url']['source'])->toBe('collection');
});

it('returns secrets list', function () {
    $_SERVER['POSTMAN_CLONE_TEST_TOKEN'] = 'tok-xyz';
    config()->set('postman-clone.environments', [
        'local' => [
            'token' => 'tok-xyz',
            'base_url' => 'http://localhost',
        ],
    ]);

    $resolver = new EnvironmentResolver();
    $secrets = $resolver->secrets('local');

    expect($secrets)->toContain('tok-xyz');
    expect($secrets)->not->toContain('http://localhost');
    unset($_SERVER['POSTMAN_CLONE_TEST_TOKEN']);
});
