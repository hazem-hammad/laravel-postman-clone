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
    Route::get('/', [AppController::class, 'show'])->name('postman-clone.app');
    Route::get('/history', [AppController::class, 'show'])->name('postman-clone.history');

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
});
