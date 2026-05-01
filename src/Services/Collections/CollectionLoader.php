<?php

namespace HazemHammad\PostmanClone\Services\Collections;

use HazemHammad\PostmanClone\Exceptions\CollectionMissingException;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;

class CollectionLoader
{
    public function __construct(private readonly PostmanV21Parser $parser = new PostmanV21Parser()) {}

    public function load(string $absolutePath): Collection
    {
        if (! is_file($absolutePath)) {
            throw new CollectionMissingException($absolutePath);
        }

        return $this->parser->parse(file_get_contents($absolutePath));
    }
}
