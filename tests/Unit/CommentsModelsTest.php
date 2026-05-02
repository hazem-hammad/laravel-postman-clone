<?php

use HazemHammad\PostmanClone\Models\LinkedIssue;
use HazemHammad\PostmanClone\Models\User;

it('persists a User row with token round-trip', function () {
    $user = User::create([
        'github_id' => 12345,
        'github_login' => 'octocat',
        'name' => 'The Octocat',
        'email' => 'octocat@example.com',
        'avatar_url' => 'https://avatars/123',
        'encrypted_access_token' => '',
        'has_repo_access' => false,
    ]);
    $user->setAccessToken('ghp_xxx');
    $user->save();

    $reloaded = User::find($user->id);
    expect($reloaded)->not->toBeNull();
    expect($reloaded->github_login)->toBe('octocat');
    expect($reloaded->getAccessToken())->toBe('ghp_xxx');
});

it('persists a LinkedIssue row', function () {
    $li = LinkedIssue::create([
        'collection_id' => 'cfg:abc',
        'request_id' => 'req-1',
        'issue_number' => 42,
        'issue_title' => 'Test issue',
        'issue_state' => 'open',
        'issue_html_url' => 'https://github.com/o/r/issues/42',
        'created_by_user_id' => 1,
        'comment_count' => 0,
    ]);

    expect(LinkedIssue::find($li->id)->isOpen())->toBeTrue();
});
