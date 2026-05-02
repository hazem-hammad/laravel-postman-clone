<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class RepoAccessRevokedException extends RuntimeException
{
    public function __construct(string $message = 'Repository access revoked')
    {
        parent::__construct($message);
    }
}
