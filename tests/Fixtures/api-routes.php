<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/email/start', [App\Http\Controllers\Api\V1\Auth\EmailController::class, 'start']);
        Route::post('/email/verify', [App\Http\Controllers\Api\V1\Auth\EmailController::class, 'verify']);
    });
    Route::get('/health', [App\Http\Controllers\Api\V1\HealthController::class, 'show']);
});
