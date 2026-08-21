<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdministrator($request);

        $users = User::query()
            ->where('role', 'admin')
            ->latest()
            ->get();

        return AdminUserResource::collection($users);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdministrator($request);

        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
            'mobile' => ['nullable', 'string', 'max:30'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'rfid' => ['nullable', 'string', 'max:255', 'unique:users,rfid'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ]);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'first_name' => $validated['firstName'],
                'last_name' => $validated['lastName'],
                'name' => trim($validated['firstName'].' '.$validated['lastName']),
                'username' => $validated['username'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'admin',
                'is_active' => $validated['status'] === 'Active',
                'mobile' => $validated['mobile'] ?? null,
                'birthday' => $validated['birthday'] ?? null,
                'department' => $validated['department'] ?? null,
                'position' => $validated['position'] ?? null,
                'rfid' => $validated['rfid'] ?? null,
            ]);

            $user->update([
                'user_code' => 'ADM-'.str_pad(
                    (string) $user->id,
                    4,
                    '0',
                    STR_PAD_LEFT,
                ),
            ]);

            return $user->refresh();
        });

        return response()->json([
            'message' => 'Administrator created successfully.',
            'user' => new AdminUserResource($user),
        ], 201);
    }

    public function show(Request $request, User $user): AdminUserResource
    {
        $this->authorizeAdministrator($request);
        $this->ensureAdminAccount($user);

        return new AdminUserResource($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureAdminAccount($user);

        $validated = $request->validate([
            'firstName' => ['required', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'username' => [
                'required',
                'string',
                'max:100',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'mobile' => ['nullable', 'string', 'max:30'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'rfid' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'rfid')->ignore($user->id),
            ],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ]);

        $user->update([
            'first_name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'name' => trim($validated['firstName'].' '.$validated['lastName']),
            'username' => $validated['username'],
            'email' => $validated['email'],
            'mobile' => $validated['mobile'] ?? null,
            'birthday' => $validated['birthday'] ?? null,
            'department' => $validated['department'] ?? null,
            'position' => $validated['position'] ?? null,
            'rfid' => $validated['rfid'] ?? null,
            'is_active' => $validated['status'] === 'Active',
        ]);

        return response()->json([
            'message' => 'Administrator updated successfully.',
            'user' => new AdminUserResource($user->refresh()),
        ]);
    }

    public function updateStatus(
        Request $request,
        User $user,
    ): JsonResponse {
        $this->authorizeAdministrator($request);
        $this->ensureAdminAccount($user);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ]);

        if ($request->user()->is($user) && $validated['status'] === 'Inactive') {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        $user->update([
            'is_active' => $validated['status'] === 'Active',
        ]);

        return response()->json([
            'message' => "Administrator set to {$validated['status']}.",
            'user' => new AdminUserResource($user->refresh()),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureAdminAccount($user);

        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'Administrator deleted successfully.',
        ]);
    }

    private function authorizeAdministrator(Request $request): void
    {
        abort_unless(
            $request->user()?->role === 'admin',
            403,
            'Only administrators may manage user accounts.',
        );
    }

    private function ensureAdminAccount(User $user): void
    {
        abort_unless(
            $user->role === 'admin',
            404,
            'Administrator account not found.',
        );
    }
}
