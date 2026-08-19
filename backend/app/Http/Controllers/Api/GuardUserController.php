<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\GuardUserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GuardUserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeAdministrator($request);

        $guards = User::query()
            ->where('role', 'guard')
            ->latest()
            ->get();
        
            return GuardUserResource::collection($guards);
    }

    private function authorizeAdministrator(Request $request): void
    {
        abort_unless(
            $request->user()->role === 'admin',
            403,
            'Only administrators may manage guard accounts.',
        );
    }
}
