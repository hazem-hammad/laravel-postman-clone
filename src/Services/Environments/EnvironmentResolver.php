<?php

namespace HazemHammad\PostmanClone\Services\Environments;

use HazemHammad\PostmanClone\Support\Storage;

class EnvironmentResolver
{
    /**
     * @param array<string,string> $collectionVariables
     * @return array<string, array{value:string,is_secret:bool,source:string}>
     */
    public function resolve(?string $environmentId, array $collectionVariables = []): array
    {
        if ($environmentId === null) {
            return [];
        }

        $configEnv = config("postman-clone.environments.{$environmentId}", []);
        $overrideEnv = $this->loadOverrides()[$environmentId] ?? [];

        $out = [];

        foreach ($collectionVariables as $key => $value) {
            $out[$key] = ['value' => (string) $value, 'is_secret' => false, 'source' => 'collection'];
        }

        foreach ($configEnv as $key => $value) {
            $out[$key] = [
                'value' => (string) $value,
                'is_secret' => $this->isSecretValue($value),
                'source' => 'config',
            ];
        }

        foreach ($overrideEnv as $key => $value) {
            $out[$key] = ['value' => (string) $value, 'is_secret' => false, 'source' => 'override'];
        }

        return $out;
    }

    /**
     * @return array<int, string>
     */
    public function secrets(string $environmentId): array
    {
        $resolved = $this->resolve($environmentId);
        $secrets = [];
        foreach ($resolved as $row) {
            if ($row['is_secret'] && $row['value'] !== '') {
                $secrets[] = $row['value'];
            }
        }
        return $secrets;
    }

    /**
     * Heuristic: a value is "secret" if its literal string appears as the value
     * of any process env var. Conservative — false positives just mean we mask
     * extra; false negatives would leak actual secrets.
     */
    protected function isSecretValue(mixed $value): bool
    {
        if (! is_string($value) || $value === '') {
            return false;
        }
        foreach ($_ENV as $envValue) {
            if (is_string($envValue) && $envValue === $value) {
                return true;
            }
        }
        foreach ($_SERVER as $envValue) {
            if (is_string($envValue) && $envValue === $value) {
                return true;
            }
        }
        return false;
    }

    /**
     * @return array<string, array<string,string>>
     */
    protected function loadOverrides(): array
    {
        $path = Storage::environmentsOverridePath();
        if (! is_file($path)) {
            return [];
        }
        $data = json_decode(file_get_contents($path), associative: true);
        return is_array($data) ? $data : [];
    }
}
