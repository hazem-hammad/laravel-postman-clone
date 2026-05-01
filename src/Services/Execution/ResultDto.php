<?php

namespace HazemHammad\PostmanClone\Services\Execution;

class ResultDto
{
    /**
     * @param array<string, array<int,string>> $headers
     */
    public function __construct(
        public readonly ?int $status,
        public readonly array $headers,
        public readonly ?string $body,
        public readonly bool $bodyTruncated,
        public readonly ?int $sizeBytes,
        public readonly int $timingMs,
        public readonly ?string $errorKind,
        public readonly ?string $errorMessage,
    ) {
    }

    public static function networkError(string $kind, string $message, int $timingMs): self
    {
        return new self(
            status: null,
            headers: [],
            body: null,
            bodyTruncated: false,
            sizeBytes: null,
            timingMs: $timingMs,
            errorKind: $kind,
            errorMessage: $message,
        );
    }

    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'headers' => $this->headers,
            'body' => $this->body,
            'body_truncated' => $this->bodyTruncated,
            'size_bytes' => $this->sizeBytes,
            'timing_ms' => $this->timingMs,
            'error_kind' => $this->errorKind,
            'error_message' => $this->errorMessage,
        ];
    }
}
