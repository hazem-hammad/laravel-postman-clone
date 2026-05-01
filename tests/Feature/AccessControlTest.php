<?php

use HazemHammad\PostmanClone\Http\Middleware\EnsurePackageEnabled;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(EnsurePackageEnabled::class)->get('/__test_gate', fn () => 'ok');
});

it('returns 404 when current env is not enabled', function () {
    // current env is 'testing' (Testbench default); only allow 'local'
    config()->set('postman-clone.access.enabled_environments', ['local']);

    $this->get('/__test_gate')->assertStatus(404);
});

it('returns 200 when env is enabled and no gate set', function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);

    $this->get('/__test_gate')->assertStatus(200)->assertSee('ok');
});

it('returns 403 when gate denies', function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
    config()->set('postman-clone.access.gate', 'viewPostmanClone');
    Gate::define('viewPostmanClone', fn ($user = null) => false);

    $this->get('/__test_gate')->assertStatus(403);
});

it('returns 200 when gate allows', function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
    config()->set('postman-clone.access.gate', 'viewPostmanClone');
    Gate::define('viewPostmanClone', fn ($user = null) => true);

    $this->get('/__test_gate')->assertStatus(200);
});
