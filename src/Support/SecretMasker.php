<?php

namespace HazemHammad\PostmanClone\Support;

class SecretMasker
{
    public const MASK = '••••••';

    /**
     * @param array<int, string> $secrets
     */
    public static function mask(string $input, array $secrets): string
    {
        foreach ($secrets as $secret) {
            if ($secret === '' || $secret === null) {
                continue;
            }
            $input = str_replace($secret, self::MASK, $input);
        }
        return $input;
    }

    /**
     * @param array<int|string, mixed> $payload
     * @param array<int, string> $secrets
     * @return array<int|string, mixed>
     */
    public static function maskArray(array $payload, array $secrets): array
    {
        array_walk_recursive($payload, function (&$value) use ($secrets): void {
            if (is_string($value)) {
                $value = self::mask($value, $secrets);
            }
        });
        return $payload;
    }
}
