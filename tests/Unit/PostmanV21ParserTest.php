<?php

use HazemHammad\PostmanClone\Exceptions\InvalidCollectionException;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;
use HazemHammad\PostmanClone\Services\Collections\Dto\Folder;
use HazemHammad\PostmanClone\Services\Collections\Dto\Request;
use HazemHammad\PostmanClone\Services\Collections\PostmanV21Parser;

it('parses a v2.1 collection with folders, requests, headers, params, body', function () {
    $json = $this->fixtureContents('sample-collection.postman_collection.json');

    $parsed = (new PostmanV21Parser())->parse($json);

    expect($parsed)->toBeInstanceOf(Collection::class);
    expect($parsed->id)->toBe('11111111-2222-3333-4444-555555555555');
    expect($parsed->name)->toBe('Sample API');
    expect($parsed->variables)->toBe(['base_url' => 'https://api.example.com']);
    expect($parsed->items)->toHaveCount(1);

    $folder = $parsed->items[0];
    expect($folder)->toBeInstanceOf(Folder::class);
    expect($folder->name)->toBe('Public');
    expect($folder->items)->toHaveCount(2);

    $first = $folder->items[0];
    expect($first)->toBeInstanceOf(Request::class);
    expect($first->id)->toBe('req-1');
    expect($first->name)->toBe('List items');
    expect($first->method)->toBe('GET');
    expect($first->url)->toBe('{{base_url}}/items?limit=10');
    expect($first->headers)->toBe([['key' => 'Accept', 'value' => 'application/json', 'disabled' => false]]);
    expect($first->params)->toBe([['key' => 'limit', 'value' => '10', 'disabled' => false]]);
    expect($first->bodyMode)->toBeNull();

    $second = $folder->items[1];
    expect($second->method)->toBe('POST');
    expect($second->bodyMode)->toBe('raw');
    expect($second->body)->toBe('{"name":"hello"}');
});

it('throws InvalidCollectionException on malformed JSON', function () {
    (new PostmanV21Parser())->parse('{not json');
})->throws(InvalidCollectionException::class);

it('throws InvalidCollectionException when info.schema is missing or wrong', function () {
    $bad = json_encode(['info' => ['name' => 'No schema'], 'item' => []]);
    (new PostmanV21Parser())->parse($bad);
})->throws(InvalidCollectionException::class);

it('handles deeply nested folders', function () {
    $deep = [
        'info' => [
            '_postman_id' => 'd-1',
            'name' => 'Deep',
            'schema' => 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        ],
        'item' => [[
            'name' => 'L1',
            'item' => [[
                'name' => 'L2',
                'item' => [[
                    '_postman_id' => 'r',
                    'name' => 'Leaf',
                    'request' => ['method' => 'GET', 'url' => 'https://x.test'],
                ]],
            ]],
        ]],
    ];

    $parsed = (new PostmanV21Parser())->parse(json_encode($deep));

    expect($parsed->items[0])->toBeInstanceOf(Folder::class);
    expect($parsed->items[0]->items[0])->toBeInstanceOf(Folder::class);
    expect($parsed->items[0]->items[0]->items[0])->toBeInstanceOf(Request::class);
});
