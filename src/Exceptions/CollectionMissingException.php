<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class CollectionMissingException extends RuntimeException
{
    public function __construct(public readonly string $missingPath)
    {
        parent::__construct("Collection file not found at: {$missingPath}");
    }
}
