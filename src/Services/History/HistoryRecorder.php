<?php

namespace HazemHammad\PostmanClone\Services\History;

use Carbon\Carbon;
use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Execution\ResultDto;
use HazemHammad\PostmanClone\Support\SecretMasker;

class HistoryRecorder
{
    public function __construct(private readonly int $pruneEvery = 50) {}

    /**
     * @param array<string, mixed> $rawPayload
     * @param array<int, string> $secrets
     */
    public function record(array $rawPayload, array $secrets, ResultDto $result): Run
    {
        $payloadForStorage = SecretMasker::maskArray([
            'headers' => $rawPayload['headers'] ?? [],
            'params' => $rawPayload['params'] ?? [],
            'body_mode' => $rawPayload['body_mode'] ?? null,
            'body' => $rawPayload['body'] ?? null,
            'auth' => $rawPayload['auth'] ?? null,
        ], $secrets);

        $urlResolved = SecretMasker::mask((string) ($rawPayload['url_resolved'] ?? ''), $secrets);

        $run = Run::create([
            'collection_id' => $rawPayload['collection_id'] ?? null,
            'request_id' => $rawPayload['request_id'] ?? null,
            'request_name' => $rawPayload['request_name'] ?? null,
            'environment_id' => $rawPayload['environment_id'] ?? null,
            'method' => (string) ($rawPayload['method'] ?? 'GET'),
            'url_raw' => (string) ($rawPayload['url_raw'] ?? ''),
            'url_resolved' => $urlResolved,
            'request_payload_json' => $payloadForStorage,
            'response_status' => $result->status,
            'response_headers_json' => $result->headers,
            'response_body' => $result->body,
            'response_body_truncated' => $result->bodyTruncated,
            'response_size_bytes' => $result->sizeBytes,
            'timing_ms' => $result->timingMs,
            'error_kind' => $result->errorKind,
            'error_message' => $result->errorMessage,
        ]);

        if ($run->id % $this->pruneEvery === 0) {
            $this->prune();
        }

        return $run;
    }

    protected function prune(): void
    {
        $maxRows = (int) config('postman-clone.history.retain_max_rows', 5000);
        $maxDays = (int) config('postman-clone.history.retain_days', 14);

        Run::where('created_at', '<', Carbon::now()->subDays($maxDays))->delete();

        $count = Run::count();
        if ($count > $maxRows) {
            $toDelete = $count - $maxRows;
            $ids = Run::orderBy('created_at', 'asc')->orderBy('id', 'asc')->limit($toDelete)->pluck('id');
            Run::whereIn('id', $ids)->delete();
        }
    }
}
