<?php

use HazemHammad\PostmanClone\Exceptions\UnresolvedVariableException;
use HazemHammad\PostmanClone\Services\Execution\VariableSubstitutor;

it('substitutes a single variable', function () {
    $vars = ['base_url' => ['value' => 'https://x.test', 'is_secret' => false, 'source' => 'config']];
    $out = (new VariableSubstitutor())->substitute('{{base_url}}/items', $vars);
    expect($out)->toBe('https://x.test/items');
});

it('substitutes multiple variables in one string', function () {
    $vars = [
        'host' => ['value' => 'api.x.test', 'is_secret' => false, 'source' => 'config'],
        'id' => ['value' => '42', 'is_secret' => false, 'source' => 'config'],
    ];
    $out = (new VariableSubstitutor())->substitute('https://{{host}}/items/{{id}}', $vars);
    expect($out)->toBe('https://api.x.test/items/42');
});

it('throws UnresolvedVariableException listing missing names', function () {
    try {
        (new VariableSubstitutor())->substitute('{{a}}/{{b}}', []);
        $this->fail('Expected exception');
    } catch (UnresolvedVariableException $e) {
        expect($e->missing)->toBe(['a', 'b']);
    }
});

it('resolves recursively up to 3 hops', function () {
    $vars = [
        'a' => ['value' => 'x={{b}}', 'is_secret' => false, 'source' => 'config'],
        'b' => ['value' => 'y={{c}}', 'is_secret' => false, 'source' => 'config'],
        'c' => ['value' => 'done', 'is_secret' => false, 'source' => 'config'],
    ];
    $out = (new VariableSubstitutor())->substitute('{{a}}', $vars);
    expect($out)->toBe('x=y=done');
});

it('bails out of cycles after 3 hops', function () {
    $vars = [
        'a' => ['value' => '{{b}}', 'is_secret' => false, 'source' => 'config'],
        'b' => ['value' => '{{a}}', 'is_secret' => false, 'source' => 'config'],
    ];
    $out = (new VariableSubstitutor())->substitute('{{a}}', $vars);
    expect($out)->toMatch('/\{\{[ab]\}\}/');
});

it('substitutes recursively across an array payload', function () {
    $vars = ['t' => ['value' => 'tok', 'is_secret' => false, 'source' => 'config']];
    $payload = [
        'url' => '{{t}}/x',
        'headers' => [['key' => 'Auth', 'value' => 'Bearer {{t}}']],
    ];
    $out = (new VariableSubstitutor())->substituteArray($payload, $vars);
    expect($out['url'])->toBe('tok/x');
    expect($out['headers'][0]['value'])->toBe('Bearer tok');
});
