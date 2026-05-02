<?php

namespace HazemHammad\PostmanClone\Services\Github;

class RouteFileResolver
{
    public function __construct(private readonly string $routesFile) {}

    /**
     * Try to map a request method + URL path to the controller class file.
     * Best-effort regex against the configured routes file. Returns the
     * absolute path on disk, or null if no match.
     */
    public function resolve(string $method, string $urlPath): ?string
    {
        if (! is_readable($this->routesFile)) {
            return null;
        }
        $contents = file_get_contents($this->routesFile);

        $path = '/'.ltrim(parse_url($urlPath, PHP_URL_PATH) ?? $urlPath, '/');
        $path = preg_replace('/\{[^}]+\}/', '*', $path);

        $needle = $this->lastSegment($path);
        if ($needle === null) {
            return null;
        }

        $methodLower = strtolower($method);
        $patterns = [
            "/Route::{$methodLower}\\([^,]+{$needle}[^,]*,\\s*\\[([A-Za-z0-9_\\\\]+)::class/i",
        ];
        foreach ($patterns as $pat) {
            if (preg_match($pat, $contents, $m)) {
                $class = ltrim($m[1], '\\');

                return $this->classFile($class);
            }
        }

        return null;
    }

    protected function lastSegment(string $path): ?string
    {
        $parts = array_filter(explode('/', $path));
        $last = end($parts);

        return $last === false ? null : preg_quote($last, '/');
    }

    protected function classFile(string $class): ?string
    {
        if (str_starts_with($class, 'App\\')) {
            return base_path(str_replace(['App\\', '\\'], ['app/', '/'], $class).'.php');
        }

        return null;
    }
}
