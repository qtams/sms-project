<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffMetadataController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        return response()->json([
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'positions' => Position::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'employmentStatuses' => ['active', 'inactive', 'on_leave', 'separated'],
        ]);
    }
}
