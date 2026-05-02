<?php

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Models\User;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
    config()->set('postman-clone.github.client_id', 'cid');
    config()->set('postman-clone.github.client_secret', 'sec');
    config()->set('postman-clone.github.repo', 'foo/bar');
});

it('start endpoint redirects to github with state in session', function () {
    $resp = $this->get('/postman/auth/github/start');
    $resp->assertRedirect();
    $location = $resp->headers->get('Location');
    expect($location)->toStartWith('https://github.com/login/oauth/authorize');
    expect($location)->toContain('client_id=cid');
    expect($location)->toContain('scope=read%3Auser+repo');
    expect(session('postman_clone_oauth_state'))->not->toBeNull();
    expect($location)->toContain('state='.session('postman_clone_oauth_state'));
});

it('callback rejects mismatched state', function () {
    $this->withSession(['postman_clone_oauth_state' => 'abc123'])
        ->get('/postman/auth/github/callback?code=x&state=different')
        ->assertStatus(400);
});

it('callback exchanges code, fetches user, gates repo, persists, signs in', function () {
    $mock = new MockHandler([
        new Response(200, [], json_encode(['access_token' => 'ghp_xyz'])),
        new Response(200, [], json_encode(['id' => 1, 'login' => 'hazem-hammad', 'name' => 'H', 'avatar_url' => 'https://a'])),
        new Response(200, [], json_encode([['email' => 'hazem@example.com', 'primary' => true, 'verified' => true]])),
        new Response(200, [], json_encode(['id' => 1])),
    ]);
    $http = new Client(['handler' => HandlerStack::create($mock), 'base_uri' => 'https://api.github.com/']);
    $this->app->bind(Client::class, fn () => $http);

    $this->withSession(['postman_clone_oauth_state' => 'abc'])
        ->get('/postman/auth/github/callback?code=valid&state=abc')
        ->assertRedirect('/postman');

    $u = User::where('github_id', 1)->first();
    expect($u)->not->toBeNull();
    expect($u->has_repo_access)->toBeTrue();
    expect($u->getAccessToken())->toBe('ghp_xyz');
});

it('marks has_repo_access false on 404 from /repos and redirects with error', function () {
    $mock = new MockHandler([
        new Response(200, [], json_encode(['access_token' => 'ghp_xyz'])),
        new Response(200, [], json_encode(['id' => 2, 'login' => 'noaccess', 'avatar_url' => ''])),
        new Response(200, [], json_encode([])),
        new Response(404, [], '{}'),
    ]);
    $http = new Client(['handler' => HandlerStack::create($mock), 'base_uri' => 'https://api.github.com/']);
    $this->app->bind(Client::class, fn () => $http);

    $this->withSession(['postman_clone_oauth_state' => 'abc'])
        ->get('/postman/auth/github/callback?code=valid&state=abc')
        ->assertRedirect('/postman?auth_error=no_repo_access');

    expect(User::where('github_id', 2)->first()->has_repo_access)->toBeFalse();
});
