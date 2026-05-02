<?php

use HazemHammad\PostmanClone\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
    Route::middleware(['postman-clone.gate', 'postman-clone.gh-auth'])
        ->get('/__test_gh_protected', fn () => 'ok');
});

it('returns 401 when no session user', function () {
    $this->getJson('/__test_gh_protected')->assertStatus(401)
        ->assertJsonPath('error', 'unauthenticated');
});

it('returns 403 when user has no repo access', function () {
    $u = User::create([
        'github_id' => 1, 'github_login' => 'x', 'avatar_url' => '',
        'encrypted_access_token' => '', 'has_repo_access' => false,
    ]);
    $this->withSession(['postman_clone_user_id' => $u->id])
        ->getJson('/__test_gh_protected')
        ->assertStatus(403)->assertJsonPath('error', 'no_repo_access');
});

it('passes through when user is authed and has repo access', function () {
    $u = User::create([
        'github_id' => 1, 'github_login' => 'x', 'avatar_url' => '',
        'encrypted_access_token' => '', 'has_repo_access' => true,
    ]);
    $this->withSession(['postman_clone_user_id' => $u->id])
        ->getJson('/__test_gh_protected')->assertStatus(200);
});
