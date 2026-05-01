<?php

namespace HazemHammad\PostmanClone\Support;

class Storage
{
    public static function dir(): string
    {
        return storage_path('postman-clone');
    }

    public static function ensureDir(): void
    {
        $dir = self::dir();
        if (! is_dir($dir)) {
            mkdir($dir, 0775, recursive: true);
        }
    }

    public static function path(string $relative): string
    {
        return self::dir() . '/' . ltrim($relative, '/');
    }

    public static function uploadsDir(): string
    {
        return self::path('uploads');
    }

    public static function environmentsOverridePath(): string
    {
        return self::path('environments.local.json');
    }
}
