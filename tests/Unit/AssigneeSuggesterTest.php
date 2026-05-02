<?php

use HazemHammad\PostmanClone\Models\User;
use HazemHammad\PostmanClone\Services\Github\AssigneeSuggester;
use HazemHammad\PostmanClone\Services\Github\GithubClient;
use HazemHammad\PostmanClone\Services\Github\GitLogReader;
use HazemHammad\PostmanClone\Services\Github\RouteFileResolver;

it('returns null when route cannot be resolved', function () {
    $resolver = new RouteFileResolver('/nonexistent/routes.php');
    $logReader = new GitLogReader(fn () => []);
    $s = new AssigneeSuggester($resolver, $logReader, '/tmp');
    expect($s->suggest('GET', '/api/v1/missing'))->toBeNull();
});

it('uses cached email->login mapping from users table', function () {
    User::create([
        'github_id' => 99, 'github_login' => 'hazem-hammad',
        'name' => 'H', 'email' => 'hazem@example.com',
        'avatar_url' => '', 'encrypted_access_token' => '',
        'has_repo_access' => true,
    ]);

    $resolver = $this->createMock(RouteFileResolver::class);
    $resolver->method('resolve')->willReturn(__FILE__);
    $logReader = new GitLogReader(fn () => [['email' => 'hazem@example.com', 'name' => 'H']]);
    $s = new AssigneeSuggester($resolver, $logReader, '/tmp');

    $result = $s->suggest('POST', '/api/v1/auth/email/start');
    expect($result)->toBe(['suggested' => 'hazem-hammad', 'source' => 'git+cache']);
});

it('falls back to GitHub search when email is not cached', function () {
    $resolver = $this->createMock(RouteFileResolver::class);
    $resolver->method('resolve')->willReturn(__FILE__);
    $logReader = new GitLogReader(fn () => [['email' => 'unknown@example.com', 'name' => 'U']]);
    $github = $this->createMock(GithubClient::class);
    $github->method('searchUserByEmail')->with('unknown@example.com')->willReturn('octocat');
    $s = new AssigneeSuggester($resolver, $logReader, '/tmp');
    $s->setClientFactory(fn () => $github);

    expect($s->suggest('POST', '/x'))->toBe(['suggested' => 'octocat', 'source' => 'git+github']);
});
