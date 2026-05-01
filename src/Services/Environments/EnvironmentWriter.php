<?php

namespace HazemHammad\PostmanClone\Services\Environments;

use HazemHammad\PostmanClone\Support\Storage;
use RuntimeException;

class EnvironmentWriter
{
    public function setOverride(string $environmentId, string $key, string $value): void
    {
        $this->mutate(function (array &$data) use ($environmentId, $key, $value): void {
            $data[$environmentId] ??= [];
            $data[$environmentId][$key] = $value;
        });
    }

    public function removeOverride(string $environmentId, string $key): void
    {
        $this->mutate(function (array &$data) use ($environmentId, $key): void {
            if (isset($data[$environmentId][$key])) {
                unset($data[$environmentId][$key]);
            }
        });
    }

    protected function mutate(callable $mutator): void
    {
        Storage::ensureDir();
        $path = Storage::environmentsOverridePath();

        $fp = fopen($path, 'c+');
        if ($fp === false) {
            throw new RuntimeException("Could not open {$path}");
        }

        try {
            if (! flock($fp, LOCK_EX)) {
                throw new RuntimeException("Could not lock {$path}");
            }

            $contents = stream_get_contents($fp);
            $data = $contents === '' ? [] : (json_decode($contents, associative: true) ?: []);

            $mutator($data);

            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            fflush($fp);
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }
}
