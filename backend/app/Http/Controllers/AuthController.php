<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $authenticated = Auth::attempt(
            [
                'username' => $credentials['username'],
                'password' => $credentials['password'],
                'is_active' => true,
            ],
            $credentials['remember'] ?? false,
        );

        if (! $authenticated) {
            throw ValidationException::withMessages([
                'username' => ['Invalid username or password.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $this->userData($request),
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userData($request),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function userData(Request $request): array
    {
        $user = $request->user()->loadMissing('staffProfile');

        return [
            'id' => $user->id,
            'name' => $user->staffProfile?->full_name ?? $user->username,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
        ];
    }
}
