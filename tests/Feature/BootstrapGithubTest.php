<?php

use HazemHammad\PostmanClone\Models\User;

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

it('bootstrap returns github block disabled when client_id missing', function () {
    config()->set('postman-clone.github.enabled', false);
    $r = $this->getJson('/postman/api/bootstrap');
    $r->assertJsonPath('github.enabled', false);
    $r->assertJsonPath('github.current_user', null);
});

it('bootstrap returns current_user when signed in', function () {
    config()->set('postman-clone.github.enabled', true);
    config()->set('postman-clone.github.repo', 'foo/bar');
    $u = User::create(['github_id' => 1, 'github_login' => 'h', 'avatar_url' => '', 'encrypted_access_token' => '', 'has_repo_access' => true]);
    $this->withSession(['postman_clone_user_id' => $u->id])
        ->getJson('/postman/api/bootstrap')
        ->assertJsonPath('github.current_user.github_login', 'h');
});
