<?php

namespace HazemHammad\PostmanClone\Services\Execution;

use HazemHammad\PostmanClone\Exceptions\UnresolvedVariableException;

class VariableSubstitutor
{
    private const MAX_HOPS = 3;
    private const PATTERN = '/\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/';

    /**
     * @param array<string, array{value:string,is_secret:bool,source:string}> $vars
     */
    public function substitute(string $input, array $vars, bool $throwOnMissing = true): string
    {
        $missing = [];
        $current = $input;

        for ($i = 0; $i < self::MAX_HOPS; $i++) {
            $next = preg_replace_callback(self::PATTERN, function (array $m) use ($vars, &$missing): string {
                $name = $m[1];
                if (! isset($vars[$name])) {
                    if (! in_array($name, $missing, true)) {
                        $missing[] = $name;
                    }
                    return $m[0];
                }
                return $vars[$name]['value'];
            }, $current);

            if ($next === $current) {
                break;
            }
            $current = $next;
        }

        if ($throwOnMissing && $missing !== []) {
            throw new UnresolvedVariableException($missing);
        }

        return $current;
    }

    /**
     * @param array<int|string, mixed> $payload
     * @param array<string, array{value:string,is_secret:bool,source:string}> $vars
     * @return array<int|string, mixed>
     */
    public function substituteArray(array $payload, array $vars, bool $throwOnMissing = true): array
    {
        array_walk_recursive($payload, function (mixed &$value) use ($vars, $throwOnMissing): void {
            if (is_string($value)) {
                $value = $this->substitute($value, $vars, $throwOnMissing);
            }
        });
        return $payload;
    }
}
