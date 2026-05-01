<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class UnresolvedVariableException extends RuntimeException
{
    /**
     * @param array<int, string> $missing
     */
    public function __construct(public readonly array $missing)
    {
        parent::__construct('Unresolved variables: ' . implode(', ', $missing));
    }
}
