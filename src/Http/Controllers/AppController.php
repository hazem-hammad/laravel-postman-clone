<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class AppController extends Controller
{
    public function show(): Response
    {
        return response()->view('postman-clone::app', [
            'theme' => config('postman-clone.theme'),
            'route_prefix' => config('postman-clone.route.prefix'),
            'manifest' => $this->loadManifest(),
        ]);
    }

    /**
     * @return array{js: string|null, css: array<int,string>}
     */
    protected function loadManifest(): array
    {
        $path = __DIR__ . '/../../../resources/dist/manifest.json';
        if (! is_file($path)) {
            return ['js' => null, 'css' => []];
        }
        $manifest = json_decode(file_get_contents($path), associative: true) ?: [];
        $entry = $manifest['src/main.tsx'] ?? null;
        if (! is_array($entry)) {
            return ['js' => null, 'css' => []];
        }
        return [
            'js' => $entry['file'] ?? null,
            'css' => $entry['css'] ?? [],
        ];
    }
}
