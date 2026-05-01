<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class InvalidCollectionException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $jsonLine = null,
        public readonly ?int $jsonColumn = null,
    ) {
        parent::__construct($message);
    }
}
