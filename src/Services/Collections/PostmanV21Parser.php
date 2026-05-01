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
                fn (array $item) => $this->parseItem($item),
                $data['item'] ?? []
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

    protected function parseItem(array $item): Folder|Request
    {
        if (isset($item['item']) && is_array($item['item'])) {
            return new Folder(
                id: (string) ($item['_postman_id'] ?? bin2hex(random_bytes(8))),
                name: (string) ($item['name'] ?? 'Folder'),
                items: array_values(array_map(
                    fn (array $child) => $this->parseItem($child),
                    $item['item']
                )),
            );
        }

        return $this->parseRequest($item);
    }

    protected function parseRequest(array $item): Request
    {
        $req = $item['request'] ?? [];

        $url = $req['url'] ?? '';
        if (is_array($url)) {
            $url = (string) ($url['raw'] ?? '');
        }

        return new Request(
            id: (string) ($item['_postman_id'] ?? bin2hex(random_bytes(8))),
            name: (string) ($item['name'] ?? 'Request'),
            method: strtoupper((string) ($req['method'] ?? 'GET')),
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
}
