<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_metadata_exposes_positions_under_their_departments(): void
    {
        $administrator = User::factory()->create(['role_id' => Role::idFor(Role::ADMIN)]);

        $response = $this->actingAs($administrator)->getJson('/api/staff-metadata');

        $response->assertOk();

        foreach ([
            ['ADMIN', 'Super Admin'],
            ['ADMIN', 'System Administrator'],
            ['REG', 'Registrar'],
            ['SEC', 'Guard'],
        ] as [$departmentCode, $positionName]) {
            $department = Department::where('code', $departmentCode)->firstOrFail();

            $this->assertDatabaseHas('positions', [
                'department_id' => $department->id,
                'name' => $positionName,
                'is_active' => true,
            ]);
        }

        $this->assertDatabaseHas('departments', [
            'code' => 'REG',
            'name' => 'Registration',
        ]);
    }

    public function test_administrator_can_create_a_normalized_guard_profile(): void
    {
        $administrator = User::factory()->create(['role_id' => Role::idFor(Role::ADMIN)]);
        $department = Department::where('code', 'SEC')->firstOrFail();
        $position = Position::where('code', 'GUARD')->firstOrFail();

        $response = $this->actingAs($administrator)->postJson('/api/guard-users', [
            'firstName' => 'Pedro',
            'middleName' => 'Santos',
            'lastName' => 'Reyes',
            'username' => 'pedro.guard',
            'email' => 'pedro@example.test',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'mobile' => '09123456789',
            'birthday' => '1990-01-01',
            'departmentId' => $department->id,
            'positionId' => $position->id,
            'employmentStatus' => 'active',
            'status' => 'Active',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'guard')
            ->assertJsonPath('user.departmentId', $department->id)
            ->assertJsonPath('user.positionId', $position->id)
            ->assertJsonPath('user.userId', 'GRD-0002');

        $this->assertDatabaseHas('users', [
            'username' => 'pedro.guard',
            'role_id' => Role::idFor(Role::GUARD),
        ]);
        $this->assertDatabaseHas('staff_profiles', [
            'first_name' => 'Pedro',
            'last_name' => 'Reyes',
            'department_id' => $department->id,
            'position_id' => $position->id,
        ]);
    }

    public function test_archiving_staff_preserves_the_user_and_profile(): void
    {
        $administrator = User::factory()->create(['role_id' => Role::idFor(Role::ADMIN)]);
        $guard = User::factory()->create(['role_id' => Role::idFor(Role::GUARD)]);
        $guard->staffProfile()->create([
            'staff_no' => 'GRD-0002',
            'first_name' => 'Pedro',
            'last_name' => 'Reyes',
            'employment_status' => 'active',
        ]);

        $this->actingAs($administrator)
            ->deleteJson("/api/guard-users/{$guard->id}")
            ->assertOk();

        $this->assertDatabaseHas('users', ['id' => $guard->id, 'is_active' => false]);
        $this->assertDatabaseHas('staff_profiles', [
            'user_id' => $guard->id,
            'employment_status' => 'separated',
        ]);
    }
}
