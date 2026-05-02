<?php

use HazemHammad\PostmanClone\Http\Controllers\AppController;
use HazemHammad\PostmanClone\Http\Controllers\BootstrapController;
use HazemHammad\PostmanClone\Http\Controllers\CollectionsController;
use HazemHammad\PostmanClone\Http\Controllers\EnvironmentsController;
use HazemHammad\PostmanClone\Http\Controllers\HistoryController;
use HazemHammad\PostmanClone\Http\Controllers\RequestRunnerController;
use Illuminate\Support\Facades\Route;

$prefix = config('postman-clone.route.prefix', 'postman');
$middleware = array_merge(['postman-clone.gate'], config('postman-clone.access.middleware', []));

Route::group([
    'prefix' => $prefix,
    'middleware' => $middleware,
], function (): void {
    Route::get('/dist/{path}', function (string $path) {
        $file = __DIR__ . '/../resources/dist/' . $path;
        if (! is_file($file)) abort(404);
        $mime = match (pathinfo($file, PATHINFO_EXTENSION)) {
            'js' => 'application/javascript',
            'css' => 'text/css',
            'json' => 'application/json',
            'svg' => 'image/svg+xml',
            default => mime_content_type($file) ?: 'application/octet-stream',
        };
        return response()->file($file, ['Content-Type' => $mime, 'Cache-Control' => 'public, max-age=31536000, immutable']);
    })->where('path', '.*');

    Route::get('/', [AppController::class, 'show'])->name('postman-clone.app');

    Route::prefix('api')->group(function (): void {
        Route::get('/bootstrap', [BootstrapController::class, 'show']);

        Route::get('/collections', [CollectionsController::class, 'index']);
        Route::get('/collections/{id}', [CollectionsController::class, 'show'])->where('id', '.*');

        Route::get('/environments', [EnvironmentsController::class, 'index']);
        Route::put('/environments/{env}/variables/{name}', [EnvironmentsController::class, 'updateVariable']);
        Route::delete('/environments/{env}/variables/{name}', [EnvironmentsController::class, 'removeOverride']);

        Route::post('/runs', [RequestRunnerController::class, 'store']);
        Route::post('/preview', [RequestRunnerController::class, 'preview']);

        Route::get('/history', [HistoryController::class, 'index']);
        Route::get('/runs/{id}', [HistoryController::class, 'show']);
        Route::delete('/runs/{id}', [HistoryController::class, 'destroy']);
    });

    // SPA catch-all — any deep link under /postman/ that isn't /api/* or
    // /dist/* falls through to the Blade shell so React Router can pick
    // it up client-side. Must be the last route in the group.
    Route::get('/{any}', [AppController::class, 'show'])
        ->where('any', '^(?!api|dist).*$')
        ->name('postman-clone.spa');
});
