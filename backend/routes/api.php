<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\GuardUserController;
use App\Http\Controllers\Api\RegistrarUserController;
use App\Http\Controllers\Api\StaffMetadataController;
use App\Http\Controllers\Api\AcademicSetupController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/staff-metadata', StaffMetadataController::class);

    Route::prefix('academic-setup')->controller(AcademicSetupController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/school-years', 'storeSchoolYear');
        Route::put('/school-years/{schoolYear}', 'updateSchoolYear');
        Route::delete('/school-years/{schoolYear}', 'destroySchoolYear');
        Route::post('/academic-units', 'storeAcademicUnit');
        Route::put('/academic-units/{academicUnit}', 'updateAcademicUnit');
        Route::delete('/academic-units/{academicUnit}', 'destroyAcademicUnit');
        Route::post('/academic-programs', 'storeAcademicProgram');
        Route::put('/academic-programs/{academicProgram}', 'updateAcademicProgram');
        Route::delete('/academic-programs/{academicProgram}', 'destroyAcademicProgram');
        Route::post('/grade-levels', 'storeGradeLevel');
        Route::put('/grade-levels/{gradeLevel}', 'updateGradeLevel');
        Route::delete('/grade-levels/{gradeLevel}', 'destroyGradeLevel');
        Route::post('/sections', 'storeSection');
        Route::put('/sections/{section}', 'updateSection');
        Route::delete('/sections/{section}', 'destroySection');
        Route::put('/sections/{section}/teachers', 'syncTeachers');
    });

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

    foreach (['guard-users' => GuardUserController::class, 'registrar-users' => RegistrarUserController::class] as $prefix => $controller) {
        Route::prefix($prefix)->group(function () use ($controller) {
            Route::get('/', [$controller, 'index']);
            Route::post('/', [$controller, 'store']);
            Route::get('/{user}', [$controller, 'show']);
            Route::put('/{user}', [$controller, 'update']);
            Route::patch('/{user}/status', [$controller, 'updateStatus']);
            Route::delete('/{user}', [$controller, 'destroy']);
        });
    }
});
