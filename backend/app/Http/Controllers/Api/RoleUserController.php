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

        return AdminUserResource::collection(User::query()
            ->with(['staffProfile.department', 'staffProfile.position'])
            ->where('role', $this->managedRole())->whereHas('staffProfile')->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $validated = $request->validate($this->validationRules());
        $user = DB::transaction(function () use ($validated) {
            $user = User::create($this->accountAttributes($validated) + [
                'password' => $validated['password'],
                'role' => $this->managedRole(),
            ]);
            $user->staffProfile()->create($this->profileAttributes($validated) + [
                'staff_no' => $this->codePrefix() . '-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
            ]);

            return $user->load(['staffProfile.department', 'staffProfile.position']);
        });

        return response()->json(['message' => $this->accountLabel() . ' created successfully.', 'user' => new AdminUserResource($user)], 201);
    }

    public function show(Request $request, User $user): AdminUserResource
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);

        return new AdminUserResource($user->load(['staffProfile.department', 'staffProfile.position']));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);
        $validated = $request->validate($this->validationRules($user));
        DB::transaction(function () use ($user, $validated) {
            $user->update($this->accountAttributes($validated));
            $user->staffProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $this->profileAttributes($validated) + [
                    'staff_no' => $user->staffProfile?->staff_no
                        ?: $this->codePrefix() . '-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
                ],
            );
        });

        return response()->json(['message' => $this->accountLabel() . ' updated successfully.', 'user' => new AdminUserResource($user->refresh()->load(['staffProfile.department', 'staffProfile.position']))]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);
        $validated = $request->validate(['status' => ['required', Rule::in(['Active', 'Inactive'])]]);
        if ($request->user()->is($user) && $validated['status'] === 'Inactive') {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        DB::transaction(function () use ($user, $validated) {
            $active = $validated['status'] === 'Active';
            $user->update(['is_active' => $active]);
            $user->staffProfile?->update(['employment_status' => $active ? 'active' : 'inactive']);
        });

        return response()->json(['message' => $this->accountLabel() . " set to {$validated['status']}.", 'user' => new AdminUserResource($user->refresh()->load(['staffProfile.department', 'staffProfile.position']))]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdministrator($request);
        $this->ensureManagedRole($user);
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'You cannot archive your own account.'], 422);
        }

        DB::transaction(function () use ($user) {
            $user->update(['is_active' => false]);
            if ($user->staffProfile) {
                $user->staffProfile?->update(['employment_status' => 'separated']);

                $user->staffProfile->delete();
            }
        });

        return response()->json(['message' => $this->accountLabel() . ' archived successfully.']);
    }

    private function validationRules(?User $user = null): array
    {
        $rules = [
            'firstName' => ['required', 'string', 'max:100'],
            'middleName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'username' => ['required', 'string', 'max:100', Rule::unique('users', 'username')->ignore($user?->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'mobile' => ['nullable', 'string', 'max:30'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:2000'],
            'departmentId' => ['nullable', 'integer', Rule::exists('departments', 'id')->where('is_active', true)],
            'positionId' => ['nullable', 'integer', Rule::exists('positions', 'id')->where('is_active', true)],
            'employmentStatus' => ['nullable', Rule::in(['active', 'inactive', 'on_leave', 'separated'])],
            'hireDate' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ];
        if ($user === null) {
            $rules['password'] = ['required', 'confirmed', Password::min(8)->letters()->numbers()];
        }

        return $rules;
    }

    private function accountAttributes(array $validated): array
    {
        return [
            'username' => $validated['username'],
            'email' => $validated['email'],
            'is_active' => $validated['status'] === 'Active',
        ];
    }

    private function profileAttributes(array $validated): array
    {
        return [
            'first_name' => $validated['firstName'],
            'middle_name' => $validated['middleName'] ?? null,
            'last_name' => $validated['lastName'],
            'suffix' => $validated['suffix'] ?? null,
            'mobile' => $validated['mobile'] ?? null,
            'birth_date' => $validated['birthday'] ?? null,
            'address' => $validated['address'] ?? null,
            'department_id' => $validated['departmentId'] ?? null,
            'position_id' => $validated['positionId'] ?? null,
            'employment_status' => $validated['employmentStatus'] ?? ($validated['status'] === 'Active' ? 'active' : 'inactive'),
            'hire_date' => $validated['hireDate'] ?? null,
        ];
    }

    private function authorizeAdministrator(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Only administrators may manage user accounts.');
    }

    private function ensureManagedRole(User $user): void
    {
        abort_unless($user->role === $this->managedRole(), 404, $this->accountLabel() . ' not found.');
    }
}
