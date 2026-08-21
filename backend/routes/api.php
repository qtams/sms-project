<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\GuardUserController;
use App\Http\Controllers\Api\RegistrarUserController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('admin-users')->group(function () {
        Route::get('/', [AdminUserController::class, 'index']);
        Route::post('/', [AdminUserController::class, 'store']);
        Route::get('/{user:user_code}', [AdminUserController::class, 'show']);
        Route::put('/{user}', [AdminUserController::class, 'update']);

        Route::patch('/{user}/status', [
            AdminUserController::class,
            'updateStatus',
        ]);

        Route::delete('/{user}', [
            AdminUserController::class,
            'destroy',
        ]);
    });

    foreach (['guard-users' => GuardUserController::class, 'registrar-users' => RegistrarUserController::class] as $prefix => $controller) {
        Route::prefix($prefix)->group(function () use ($controller) {
            Route::get('/', [$controller, 'index']);
            Route::post('/', [$controller, 'store']);
            Route::get('/{user:user_code}', [$controller, 'show']);
            Route::put('/{user}', [$controller, 'update']);
            Route::patch('/{user}/status', [$controller, 'updateStatus']);
            Route::delete('/{user}', [$controller, 'destroy']);
        });
    }
});
