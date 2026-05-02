<?php

use HazemHammad\PostmanClone\Services\Collections\PostmanV21Parser;

/**
 * Smoke test against the real Ticket-scape Postman collection living in the
 * parent monorepo. Skipped automatically if the file isn't present (e.g. when
 * the package is checked out standalone for OSS work).
 */

beforeEach(function () {
    config()->set('postman-clone.access.enabled_environments', [app()->environment()]);
});

it('parses the real Ticket-scape collection without errors', function () {
    $path = __DIR__ . '/../../../docs/postman/ticketscape.postman_collection.json';
    if (! file_exists($path)) {
        $this->markTestSkipped('Ticket-scape collection not present at ' . $path);
    }

    $json = file_get_contents($path);
    $parsed = (new PostmanV21Parser())->parse($json);

    expect($parsed->name)->toBe('Ticket Scape API');
    expect(count($parsed->items))->toBeGreaterThan(0);
});

it('serves the Ticket-scape collection via /api/collections', function () {
    $path = __DIR__ . '/../../../docs/postman/ticketscape.postman_collection.json';
    if (! file_exists($path)) {
        $this->markTestSkipped('Ticket-scape collection not present');
    }

    config()->set('postman-clone.collections', [$path]);
    $id = 'cfg:' . sha1($path);

    $list = $this->getJson('/postman/api/collections');
    $list->assertStatus(200);
    expect($list->json('data.0.name'))->toBe('Ticket Scape API');
    expect($list->json('data.0.missing'))->toBeFalse();

    $detail = $this->getJson('/postman/api/collections/' . urlencode($id));
    $detail->assertStatus(200);
    expect($detail->json('name'))->toBe('Ticket Scape API');
});
