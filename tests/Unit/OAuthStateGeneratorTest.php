<?php

use HazemHammad\PostmanClone\Services\Github\OAuthStateGenerator;
use Illuminate\Support\Facades\Session;

it('generates a 32-char hex state and stores in session', function () {
    Session::start();
    $g = new OAuthStateGenerator();
    $state = $g->generate();
    expect($state)->toMatch('/^[0-9a-f]{32}$/');
    expect(Session::get('postman_clone_oauth_state'))->toBe($state);
});

it('validates a matching state and one-shots it', function () {
    Session::start();
    $g = new OAuthStateGenerator();
    $state = $g->generate();
    expect($g->validate($state))->toBeTrue();
    expect($g->validate($state))->toBeFalse();
});

it('rejects mismatched state', function () {
    Session::start();
    $g = new OAuthStateGenerator();
    $g->generate();
    expect($g->validate('a-different-state'))->toBeFalse();
});

it('rejects when no state is in session', function () {
    Session::start();
    Session::forget('postman_clone_oauth_state');
    $g = new OAuthStateGenerator();
    expect($g->validate('anything'))->toBeFalse();
});
