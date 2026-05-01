<?php

use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use HazemHammad\PostmanClone\Support\Storage;

afterEach(function () {
    if (is_dir(Storage::dir())) {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(Storage::dir(), FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($it as $f) {
            $f->isDir() ? rmdir($f->getRealPath()) : unlink($f->getRealPath());
        }
    }
});

it('lists collections from config paths', function () {
    config()->set('postman-clone.collections', [
        $this->fixturePath('sample-collection.postman_collection.json'),
    ]);

    $entries = (new CollectionRegistry())->all();

    expect($entries)->toHaveCount(1);
    expect($entries[0]['name'])->toBe('Sample API');
    expect($entries[0]['source'])->toBe('config');
    expect($entries[0]['id'])->toBeString();
});

it('skips missing config paths but flags them', function () {
    config()->set('postman-clone.collections', [
        '/no/such/file.json',
        $this->fixturePath('sample-collection.postman_collection.json'),
    ]);

    $entries = (new CollectionRegistry())->all();

    expect($entries)->toHaveCount(2);
    expect($entries[0]['missing'])->toBeTrue();
    expect($entries[1]['missing'])->toBeFalse();
});

it('lists uploaded collections from uploads.json', function () {
    Storage::ensureDir();
    if (! is_dir(Storage::uploadsDir())) {
        mkdir(Storage::uploadsDir(), 0775, recursive: true);
    }
    $uploadPath = Storage::uploadsDir() . '/abc.postman_collection.json';
    copy($this->fixturePath('sample-collection.postman_collection.json'), $uploadPath);
    file_put_contents(Storage::path('uploads.json'), json_encode([
        ['id' => 'abc', 'original_name' => 'mine.json', 'uploaded_at' => '2026-05-02T00:00:00Z'],
    ]));

    config()->set('postman-clone.collections', []);

    $entries = (new CollectionRegistry())->all();

    expect($entries)->toHaveCount(1);
    expect($entries[0]['source'])->toBe('upload');
    expect($entries[0]['name'])->toBe('Sample API');
});
