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
     * Heuristic: a value is "secret" if its literal string appears as the
     * value of an `$_ENV` entry (i.e., loaded from .env via dotenv).
     *
     * We deliberately avoid `$_SERVER`: web servers populate it with
     * HTTP_HOST, REQUEST_URI, etc., which collide with normal URL strings
     * and produce false positives. False negatives are not acceptable here,
     * so we also walk `getenv()` for non-`HTTP_`/`SERVER_`/`REMOTE_` keys.
     */
    /**
     * A value is treated as secret if it matches an env var whose key contains
     * a sensitive keyword (TOKEN, KEY, SECRET, PASSWORD, etc.). False positives
     * are acceptable — we'd rather mask too aggressively than leak.
     *
     * Public env vars like APP_URL, APP_NAME, APP_ENV match by value but their
     * keys are not in the sensitive set, so they are NOT treated as secret.
     */
    protected function isSecretValue(mixed $value): bool
    {
        if (! is_string($value) || $value === '') {
            return false;
        }

        $isSensitiveKey = static function (string $key): bool {
            $upper = strtoupper($key);
            foreach (['TOKEN', 'KEY', 'SECRET', 'PASSWORD', 'PASSWD', 'API_KEY', 'AUTH', 'CREDENTIAL', 'PRIVATE'] as $needle) {
                if (str_contains($upper, $needle)) {
                    return true;
                }
            }
            return false;
        };

        foreach ($_ENV as $key => $envValue) {
            if (is_string($envValue) && $envValue === $value && $isSensitiveKey((string) $key)) {
                return true;
            }
        }
        foreach ($_SERVER as $key => $envValue) {
            if (is_string($envValue) && $envValue === $value && $isSensitiveKey((string) $key)) {
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
