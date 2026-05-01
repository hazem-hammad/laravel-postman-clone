<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class BootstrapController extends Controller
{
    public function show(CollectionRegistry $registry): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        $envList = [];
        foreach ($envs as $id => $vars) {
            $envList[] = [
                'id' => $id,
                'variable_count' => count($vars),
            ];
        }

        return response()->json([
            'collections' => array_values(array_map(fn ($e) => [
                'id' => $e['id'],
                'name' => $e['name'],
                'source' => $e['source'],
                'missing' => $e['missing'],
            ], $registry->all())),
            'environments' => $envList,
            'active_environment' => config('postman-clone.default_environment'),
            'history_count' => Run::count(),
        ]);
    }
}
