<?php

namespace HazemHammad\PostmanClone\Services\Collections\Dto;

class Collection
{
    /**
     * @param array<string,string> $variables
     * @param array<int, Folder|Request> $items
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly array $variables,
        public readonly array $items,
    ) {
    }
}
