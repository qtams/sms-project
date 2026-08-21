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

abstract class RoleUserController extends Controller
{
    abstract protected function managedRole(): string;

    abstract protected function codePrefix(): string;

    abstract protected function accountLabel(): string;

    public function index(Request $request)
    {
        $this->authorizeAdministrator($request);

        return AdminUserResource::collection(User::query()->where('role', $this->managedRole())->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $validated = $request->validate($this->validationRules());
        $user = DB::transaction(function () use ($validated) {
            $user = User::create($this->attributes($validated) + [
                'password' => $validated['password'],
                'role' => $this->managedRole(),
            ]);
            $user->update(['user_code' => $this->codePrefix().'-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT)]);

            return $user->refresh();
        });

        return response()->json(['message' => $this->accountLabel().' created successfully.', 'user' => new AdminUserResource($user)], 201);
    }

    public function show(Request $request, User $user): AdminUserResource
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);

        return new AdminUserResource($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);
        $validated = $request->validate($this->validationRules($user));
        $user->update($this->attributes($validated));

        return response()->json(['message' => $this->accountLabel().' updated successfully.', 'user' => new AdminUserResource($user->refresh())]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);
        $validated = $request->validate(['status' => ['required', Rule::in(['Active', 'Inactive'])]]);
        $user->update(['is_active' => $validated['status'] === 'Active']);

        return response()->json(['message' => $this->accountLabel()." set to {$validated['status']}.", 'user' => new AdminUserResource($user->refresh())]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);
        $user->delete();

        return response()->json(['message' => $this->accountLabel().' deleted successfully.']);
    }

    private function validationRules(?User $user = null): array
    {
        $rules = [
            'firstName' => ['required', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:100', Rule::unique('users', 'username')->ignore($user?->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'mobile' => ['nullable', 'string', 'max:30'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'rfid' => ['nullable', 'string', 'max:255', Rule::unique('users', 'rfid')->ignore($user?->id)],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ];
        if ($user === null) {
            $rules['password'] = ['required', 'confirmed', Password::min(8)->letters()->numbers()];
        }

        return $rules;
    }

    private function attributes(array $validated): array
    {
        return [
            'first_name' => $validated['firstName'], 'last_name' => $validated['lastName'],
            'name' => trim($validated['firstName'].' '.$validated['lastName']),
            'username' => $validated['username'], 'email' => $validated['email'],
            'is_active' => $validated['status'] === 'Active', 'mobile' => $validated['mobile'] ?? null,
            'birthday' => $validated['birthday'] ?? null, 'department' => $validated['department'] ?? null,
            'position' => $validated['position'] ?? null, 'rfid' => $validated['rfid'] ?? null,
        ];
    }

    private function authorizeAdministrator(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Only administrators may manage user accounts.');
    }

    private function ensureManagedRole(User $user): void
    {
        abort_unless($user->role === $this->managedRole(), 404, $this->accountLabel().' not found.');
    }
}
