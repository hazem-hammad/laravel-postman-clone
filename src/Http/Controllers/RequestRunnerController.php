<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use GuzzleHttp\Client;
use HazemHammad\PostmanClone\Exceptions\UnresolvedVariableException;
use HazemHammad\PostmanClone\Http\Requests\RunRequestPayload;
use HazemHammad\PostmanClone\Services\Environments\EnvironmentResolver;
use HazemHammad\PostmanClone\Services\Execution\RequestExecutor;
use HazemHammad\PostmanClone\Services\Execution\VariableSubstitutor;
use HazemHammad\PostmanClone\Services\History\HistoryRecorder;
use HazemHammad\PostmanClone\Support\SecretMasker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class RequestRunnerController extends Controller
{
    public function __construct(
        private readonly EnvironmentResolver $resolver,
        private readonly VariableSubstitutor $substitutor,
        private readonly HistoryRecorder $recorder,
    ) {
    }

    public function store(RunRequestPayload $request): JsonResponse
    {
        $payload = $request->validated();
        $envId = $payload['environment_id'] ?? null;
        $vars = $this->resolver->resolve($envId);
        $secrets = $envId !== null ? $this->resolver->secrets($envId) : [];

        try {
            $resolvedUrl = $this->substitutor->substitute($payload['url'], $vars);
            $resolvedHeaders = $this->substitutor->substituteArray($payload['headers'] ?? [], $vars);
            $resolvedParams = $this->substitutor->substituteArray($payload['params'] ?? [], $vars);
            $resolvedBody = is_string($payload['body'] ?? null)
                ? $this->substitutor->substitute($payload['body'], $vars)
                : ($payload['body'] ?? null);
        } catch (UnresolvedVariableException $e) {
            return response()->json([
                'error' => ['kind' => 'unresolved_variable', 'missing' => $e->missing],
            ], 422);
        }

        $executor = new RequestExecutor(
            app(Client::class),
            config('postman-clone.execution'),
        );

        $result = $executor->execute([
            'method' => $payload['method'],
            'url' => $resolvedUrl,
            'headers' => $resolvedHeaders,
            'params' => $resolvedParams,
            'body_mode' => $payload['body_mode'] ?? null,
            'body' => $resolvedBody,
        ]);

        $run = $this->recorder->record(
            rawPayload: [
                'collection_id' => $payload['collection_id'] ?? null,
                'request_id' => $payload['request_id'] ?? null,
                'request_name' => $payload['request_name'] ?? null,
                'environment_id' => $envId,
                'method' => $payload['method'],
                'url_raw' => $payload['url'],
                'url_resolved' => $resolvedUrl,
                'headers' => $resolvedHeaders,
                'params' => $resolvedParams,
                'body_mode' => $payload['body_mode'] ?? null,
                'body' => $resolvedBody,
            ],
            secrets: $secrets,
            result: $result,
        );

        return response()->json([
            'run_id' => $run->id,
            'result' => $result->toArray(),
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $url = (string) $request->input('url', '');
        $envId = $request->input('environment_id');
        $vars = $this->resolver->resolve($envId);
        $secrets = $envId !== null ? $this->resolver->secrets($envId) : [];

        try {
            $resolved = $this->substitutor->substitute($url, $vars);
        } catch (UnresolvedVariableException $e) {
            return response()->json(['url' => $url, 'missing' => $e->missing]);
        }

        return response()->json(['url' => SecretMasker::mask($resolved, $secrets)]);
    }
}
