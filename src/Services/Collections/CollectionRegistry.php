<?php

namespace HazemHammad\PostmanClone\Services\Collections;

use HazemHammad\PostmanClone\Support\Storage;

class CollectionRegistry
{
    public function __construct(private readonly CollectionLoader $loader = new CollectionLoader()) {}

    /**
     * @return array<int, array{id:string,name:string,source:string,path:string,missing:bool}>
     */
    public function all(): array
    {
        $entries = [];

        foreach (config('postman-clone.collections', []) as $path) {
            $entries[] = $this->buildConfigEntry((string) $path);
        }

        foreach ($this->uploads() as $upload) {
            $entries[] = $this->buildUploadEntry($upload);
        }

        return $entries;
    }

    /**
     * @return array{id:string,name:string,source:string,path:string,missing:bool}|null
     */
    public function find(string $id): ?array
    {
        foreach ($this->all() as $entry) {
            if ($entry['id'] === $id) {
                return $entry;
            }
        }
        return null;
    }

    /**
     * @return array<int, array{id:string,original_name:string,uploaded_at:string}>
     */
    protected function uploads(): array
    {
        $path = Storage::path('uploads.json');
        if (! is_file($path)) {
            return [];
        }
        $data = json_decode(file_get_contents($path), associative: true) ?: [];
        return is_array($data) ? $data : [];
    }

    protected function buildConfigEntry(string $path): array
    {
        $missing = ! is_file($path);
        $name = basename($path);
        if (! $missing) {
            try {
                $name = $this->loader->load($path)->name;
            } catch (\Throwable) {
                // leave basename
            }
        }

        return [
            'id' => 'cfg:' . sha1($path),
            'name' => $name,
            'source' => 'config',
            'path' => $path,
            'missing' => $missing,
        ];
    }

    protected function buildUploadEntry(array $row): array
    {
        $path = Storage::uploadsDir() . '/' . $row['id'] . '.postman_collection.json';
        $missing = ! is_file($path);
        $name = $row['original_name'] ?? 'Uploaded';
        if (! $missing) {
            try {
                $name = $this->loader->load($path)->name;
            } catch (\Throwable) {
                // keep original_name
            }
        }

        return [
            'id' => 'up:' . $row['id'],
            'name' => $name,
            'source' => 'upload',
            'path' => $path,
            'missing' => $missing,
        ];
    }
}
