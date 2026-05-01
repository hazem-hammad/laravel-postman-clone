<?php

use HazemHammad\PostmanClone\Exceptions\CollectionMissingException;
use HazemHammad\PostmanClone\Services\Collections\CollectionLoader;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;

it('loads and parses a collection from disk', function () {
    $loader = new CollectionLoader();
    $parsed = $loader->load($this->fixturePath('sample-collection.postman_collection.json'));

    expect($parsed)->toBeInstanceOf(Collection::class);
    expect($parsed->name)->toBe('Sample API');
});

it('throws CollectionMissingException when file does not exist', function () {
    (new CollectionLoader())->load('/no/such/path/collection.json');
})->throws(CollectionMissingException::class);
