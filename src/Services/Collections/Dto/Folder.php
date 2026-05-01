<?php

namespace HazemHammad\PostmanClone\Services\Collections\Dto;

class Folder
{
    /**
     * @param array<int, Folder|Request> $items
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly array $items,
    ) {
    }
}
