<?php

use HazemHammad\PostmanClone\Services\Github\RepoIdentityResolver;

it('returns config value when set', function () {
    config()->set('postman-clone.github.repo', 'foo/bar');
    expect((new RepoIdentityResolver())->resolve('/some/path'))->toBe('foo/bar');
});

it('parses HTTPS git remote URLs', function () {
    config()->set('postman-clone.github.repo', null);
    $resolver = new RepoIdentityResolver(fn () => 'https://github.com/foo/bar.git');
    expect($resolver->resolve('/some/path'))->toBe('foo/bar');
});

it('parses SSH git remote URLs', function () {
    config()->set('postman-clone.github.repo', null);
    $resolver = new RepoIdentityResolver(fn () => 'git@github.com:foo/bar.git');
    expect($resolver->resolve('/some/path'))->toBe('foo/bar');
});

it('strips trailing .git', function () {
    config()->set('postman-clone.github.repo', null);
    $resolver = new RepoIdentityResolver(fn () => 'https://github.com/foo/bar');
    expect($resolver->resolve('/some/path'))->toBe('foo/bar');
});

it('returns null when neither config nor remote is available', function () {
    config()->set('postman-clone.github.repo', null);
    $resolver = new RepoIdentityResolver(fn () => null);
    expect($resolver->resolve('/some/path'))->toBeNull();
});

it('returns null when remote is not a github URL', function () {
    config()->set('postman-clone.github.repo', null);
    $resolver = new RepoIdentityResolver(fn () => 'https://gitlab.com/foo/bar.git');
    expect($resolver->resolve('/some/path'))->toBeNull();
});
