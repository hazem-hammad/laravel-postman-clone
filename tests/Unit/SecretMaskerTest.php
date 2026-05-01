<?php

use HazemHammad\PostmanClone\Support\SecretMasker;

it('replaces a secret value with bullets in a string', function () {
    $masked = SecretMasker::mask(
        'Authorization: Bearer abc123',
        ['abc123']
    );

    expect($masked)->toBe('Authorization: Bearer ••••••');
});

it('handles multiple secret values in one string', function () {
    $masked = SecretMasker::mask(
        'token=alpha&id=42&key=beta',
        ['alpha', 'beta']
    );

    expect($masked)->toBe('token=••••••&id=42&key=••••••');
});

it('returns input unchanged when no secrets', function () {
    $masked = SecretMasker::mask('plain text', []);
    expect($masked)->toBe('plain text');
});

it('skips empty secret strings', function () {
    $masked = SecretMasker::mask('hello world', ['', 'world']);
    expect($masked)->toBe('hello ••••••');
});
