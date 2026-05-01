<?php

namespace HazemHammad\PostmanClone\Services\Collections\Dto;

class Request
{
    /**
     * @param array<int, array{key:string,value:string,disabled?:bool}> $headers
     * @param array<int, array{key:string,value:string,disabled?:bool}> $params
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $method,
        public readonly string $url,
        public readonly array $headers,
        public readonly array $params,
        public readonly ?string $bodyMode,
        public readonly mixed $body,
        public readonly ?array $auth,
    ) {
    }
}
