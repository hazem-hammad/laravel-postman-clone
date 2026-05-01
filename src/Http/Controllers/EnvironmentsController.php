<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Http\Requests\UpdateEnvironmentVariableRequest;
use HazemHammad\PostmanClone\Services\Environments\EnvironmentResolver;
use HazemHammad\PostmanClone\Services\Environments\EnvironmentWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class EnvironmentsController extends Controller
{
    public function __construct(
        private readonly EnvironmentResolver $resolver,
        private readonly EnvironmentWriter $writer,
    ) {
    }

    public function index(): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        $data = [];
        foreach ($envs as $id => $configVars) {
            $merged = $this->resolver->resolve((string) $id);
            $variables = [];
            foreach ($merged as $name => $row) {
                $variables[] = [
                    'name' => $name,
                    'value' => $row['is_secret'] ? '••••••' : $row['value'],
                    'is_secret' => $row['is_secret'],
                    'source' => $row['source'],
                ];
            }
            $data[] = [
                'id' => (string) $id,
                'variables' => $variables,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function updateVariable(UpdateEnvironmentVariableRequest $request, string $env, string $name): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        if (! isset($envs[$env])) {
            abort(404);
        }

        $this->writer->setOverride($env, $name, $request->string('value')->toString());

        $merged = $this->resolver->resolve($env);
        $row = $merged[$name] ?? null;

        return response()->json([
            'variable' => [
                'name' => $name,
                'value' => isset($row) && $row['is_secret'] ? '••••••' : ($row['value'] ?? ''),
                'is_secret' => $row['is_secret'] ?? false,
                'source' => $row['source'] ?? 'override',
            ],
        ]);
    }

    public function removeOverride(string $env, string $name): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        if (! isset($envs[$env])) {
            abort(404);
        }

        $this->writer->removeOverride($env, $name);

        return response()->json(['ok' => true]);
    }
}
