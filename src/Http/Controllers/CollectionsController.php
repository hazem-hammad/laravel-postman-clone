<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Exceptions\CollectionMissingException;
use HazemHammad\PostmanClone\Exceptions\InvalidCollectionException;
use HazemHammad\PostmanClone\Services\Collections\CollectionLoader;
use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use HazemHammad\PostmanClone\Services\Collections\Dto\Folder;
use HazemHammad\PostmanClone\Services\Collections\Dto\Request as CollectionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CollectionsController extends Controller
{
    public function __construct(
        private readonly CollectionRegistry $registry,
        private readonly CollectionLoader $loader,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => array_values(array_map(fn ($e) => [
                'id' => $e['id'],
                'name' => $e['name'],
                'source' => $e['source'],
                'missing' => $e['missing'],
            ], $this->registry->all())),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $entry = $this->registry->find($id);
        if ($entry === null) {
            abort(404);
        }
        if ($entry['missing']) {
            abort(410, 'Collection file is missing');
        }

        try {
            $collection = $this->loader->load($entry['path']);
        } catch (CollectionMissingException) {
            abort(410, 'Collection file is missing');
        } catch (InvalidCollectionException $e) {
            return response()->json([
                'error' => [
                    'kind' => 'invalid_collection',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }

        return response()->json([
            'id' => $collection->id,
            'name' => $collection->name,
            'description' => $collection->description,
            'variables' => $collection->variables,
            'items' => array_map(fn ($i) => $this->serializeItem($i), $collection->items),
        ]);
    }

    protected function serializeItem(Folder|CollectionRequest $item): array
    {
        if ($item instanceof Folder) {
            return [
                'type' => 'folder',
                'id' => $item->id,
                'name' => $item->name,
                'items' => array_map(fn ($c) => $this->serializeItem($c), $item->items),
            ];
        }

        return [
            'type' => 'request',
            'id' => $item->id,
            'name' => $item->name,
            'method' => $item->method,
            'url' => $item->url,
            'headers' => $item->headers,
            'params' => $item->params,
            'body_mode' => $item->bodyMode,
            'body' => $item->body,
            'auth' => $item->auth,
        ];
    }
}
