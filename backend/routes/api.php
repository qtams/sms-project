<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\GuardUserController;
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
        Route::get('/{user}', [AdminUserController::class, 'show']);
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

    Route::prefix('guard-users')->group(function() {
        Route::get('/', [GuardUserController::class, 'index']);
    });
});
