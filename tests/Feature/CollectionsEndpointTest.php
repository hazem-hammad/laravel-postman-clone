<?php

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

it('lists all collections', function () {
    config()->set('postman-clone.collections', [$this->fixturePath('sample-collection.postman_collection.json')]);

    $res = $this->getJson('/postman/api/collections');
    $res->assertStatus(200);
    expect($res->json('data.0.name'))->toBe('Sample API');
});

it('returns the parsed tree for a single collection', function () {
    $path = $this->fixturePath('sample-collection.postman_collection.json');
    config()->set('postman-clone.collections', [$path]);
    $id = 'cfg:' . sha1($path);

    $res = $this->getJson('/postman/api/collections/' . urlencode($id));

    $res->assertStatus(200);
    expect($res->json('id'))->toBe('11111111-2222-3333-4444-555555555555');
    expect($res->json('name'))->toBe('Sample API');
    expect($res->json('items.0.items.0.name'))->toBe('List items');
});

it('returns 410 Gone when collection file is missing', function () {
    config()->set('postman-clone.collections', ['/no/such/file.json']);
    $id = 'cfg:' . sha1('/no/such/file.json');

    $res = $this->getJson('/postman/api/collections/' . urlencode($id));

    $res->assertStatus(410);
});

it('returns 404 for unknown collection id', function () {
    config()->set('postman-clone.collections', []);
    $this->getJson('/postman/api/collections/cfg:does-not-exist')->assertStatus(404);
});
