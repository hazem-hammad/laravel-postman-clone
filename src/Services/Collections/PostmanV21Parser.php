<?php

namespace HazemHammad\PostmanClone\Services\Collections;

use HazemHammad\PostmanClone\Exceptions\InvalidCollectionException;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;
use HazemHammad\PostmanClone\Services\Collections\Dto\Folder;
use HazemHammad\PostmanClone\Services\Collections\Dto\Request;

class PostmanV21Parser
{
    public function parse(string $json): Collection
    {
        try {
            $data = json_decode($json, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new InvalidCollectionException('Invalid JSON: ' . $e->getMessage());
        }

        if (! is_array($data) || ! isset($data['info'])) {
            throw new InvalidCollectionException('Missing top-level "info" object');
        }

        $schema = $data['info']['schema'] ?? null;
        if (! is_string($schema) || ! str_contains($schema, 'collection/v2.1')) {
            throw new InvalidCollectionException(
                'Unsupported or missing schema (expected v2.1.0): ' . ($schema ?? 'null')
            );
        }

        return new Collection(
            id: (string) ($data['info']['_postman_id'] ?? ''),
            name: (string) ($data['info']['name'] ?? 'Untitled'),
            description: $data['info']['description'] ?? null,
            variables: $this->parseVariables($data['variable'] ?? []),
            items: array_values(array_map(
                fn (array $item, int $idx) => $this->parseItem($item, '', $idx),
                $data['item'] ?? [],
                array_keys($data['item'] ?? [])
            )),
        );
    }

    /**
     * @param array<int, array<string,mixed>> $list
     * @return array<string,string>
     */
    protected function parseVariables(array $list): array
    {
        $out = [];
        foreach ($list as $row) {
            if (isset($row['key'])) {
                $out[(string) $row['key']] = (string) ($row['value'] ?? '');
            }
        }
        return $out;
    }

    /**
     * Parse one item. The path argument is the slash-joined names of the
     * ancestor folders, used to derive a stable id when _postman_id is
     * missing. Without this, ids would be random per parser run and any
     * client that captured one (e.g. via a deep-link URL) would break on
     * the next reload.
     */
    protected function parseItem(array $item, string $parentPath, int $index): Folder|Request
    {
        $name = (string) ($item['name'] ?? 'Unnamed');
        $path = $parentPath === '' ? $name : $parentPath . '/' . $name;

        if (isset($item['item']) && is_array($item['item'])) {
            return new Folder(
                id: $this->itemId($item, 'folder', $path, $index),
                name: $name,
                items: array_values(array_map(
                    fn (array $child, int $childIdx) => $this->parseItem($child, $path, $childIdx),
                    $item['item'],
                    array_keys($item['item'])
                )),
            );
        }

        return $this->parseRequest($item, $path, $index);
    }

    protected function parseRequest(array $item, string $path, int $index): Request
    {
        $req = $item['request'] ?? [];

        $url = $req['url'] ?? '';
        if (is_array($url)) {
            $url = (string) ($url['raw'] ?? '');
        }

        $method = strtoupper((string) ($req['method'] ?? 'GET'));

        return new Request(
            id: $this->itemId($item, 'request', $path . '|' . $method . '|' . $url, $index),
            name: (string) ($item['name'] ?? 'Request'),
            method: $method,
            url: (string) $url,
            headers: array_values(array_map(
                fn (array $h) => [
                    'key' => (string) ($h['key'] ?? ''),
                    'value' => (string) ($h['value'] ?? ''),
                    'disabled' => (bool) ($h['disabled'] ?? false),
                ],
                $req['header'] ?? []
            )),
            params: array_values(array_map(
                fn (array $q) => [
                    'key' => (string) ($q['key'] ?? ''),
                    'value' => (string) ($q['value'] ?? ''),
                    'disabled' => (bool) ($q['disabled'] ?? false),
                ],
                (is_array($req['url'] ?? null) ? ($req['url']['query'] ?? []) : [])
            )),
            bodyMode: $req['body']['mode'] ?? null,
            body: $req['body']['raw'] ?? $req['body']['formdata'] ?? $req['body']['urlencoded'] ?? null,
            auth: $req['auth'] ?? null,
        );
    }

    /**
     * Stable id resolution:
     *   1. _postman_id when present (the canonical Postman identifier)
     *   2. otherwise, sha1 of (kind | path | index) — deterministic across
     *      parser runs as long as the collection structure is unchanged
     */
    protected function itemId(array $item, string $kind, string $signature, int $index): string
    {
        $explicit = $item['_postman_id'] ?? null;
        if (is_string($explicit) && $explicit !== '') {
            return $explicit;
        }
        return substr(sha1($kind . '|' . $signature . '|' . $index), 0, 16);
    }
}
