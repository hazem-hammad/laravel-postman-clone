<?php

use HazemHammad\PostmanClone\Http\Controllers\AppController;
use HazemHammad\PostmanClone\Http\Controllers\AuthController;
use HazemHammad\PostmanClone\Http\Controllers\BootstrapController;
use HazemHammad\PostmanClone\Http\Controllers\CollectionsController;
use HazemHammad\PostmanClone\Http\Controllers\EnvironmentsController;
use HazemHammad\PostmanClone\Http\Controllers\HistoryController;
use HazemHammad\PostmanClone\Http\Controllers\IssuesController;
use HazemHammad\PostmanClone\Http\Controllers\MeController;
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

    Route::get('/auth/github/start', [AuthController::class, 'start']);
    Route::get('/auth/github/callback', [AuthController::class, 'callback']);
    Route::post('/auth/sign-out', [AuthController::class, 'signOut'])
        ->middleware('postman-clone.gh-auth');

    Route::prefix('api')->group(function (): void {
        Route::get('/bootstrap', [BootstrapController::class, 'show']);

        Route::get('/me', [MeController::class, 'show'])->middleware('postman-clone.gh-auth');

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

        Route::get('/issues/counts', [IssuesController::class, 'counts']);
        Route::post('/issues', [IssuesController::class, 'store'])
            ->middleware('postman-clone.gh-auth');
        Route::post('/issues/sync-status', [IssuesController::class, 'syncStatus'])
            ->middleware('postman-clone.gh-auth');
        Route::get('/issues/suggest-assignee', [IssuesController::class, 'suggestAssignee'])
            ->middleware('postman-clone.gh-auth');
        Route::get('/issues/collaborators', [IssuesController::class, 'collaborators'])
            ->middleware('postman-clone.gh-auth');
        Route::get('/issues/{id}/thread', [IssuesController::class, 'thread'])
            ->middleware('postman-clone.gh-auth')->whereNumber('id');
        Route::post('/issues/{id}/refresh', [IssuesController::class, 'refresh'])
            ->middleware('postman-clone.gh-auth')->whereNumber('id');
    });

    // SPA catch-all — any deep link under /postman/ that isn't /api/* or
    // /dist/* falls through to the Blade shell so React Router can pick
    // it up client-side. Must be the last route in the group.
    Route::get('/{any}', [AppController::class, 'show'])
        ->where('any', '^(?!api|dist).*$')
        ->name('postman-clone.spa');
});
