<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class GithubApiException extends RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly mixed $body,
        public readonly ?string $retryAfter = null,
        string $message = '',
    ) {
        parent::__construct($message ?: "GitHub API returned {$status}");
    }
}
