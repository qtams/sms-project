<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $department = Department::firstOrCreate(
            ['code' => 'ADMIN'],
            [
                'name' => 'Administration',
                'is_active' => true,
            ]
        );

        $position = Position::updateOrCreate(
            ['code' => 'SYS_ADMIN'],
            [
                'department_id' => $department->id,
                'name' => 'System Administrator',
                'is_active' => true,
            ]
        );

        $user = User::updateOrCreate(
            ['username' => '@Tamahome'],
            [
                'email' => 'tamahome@gmail.com',
                'password' => Hash::make(env('ADMIN_INITIAL_PASSWORD', '@Kulets12')),
                'role_id' => Role::idFor(Role::ADMIN),
                'is_active' => true,
            ]
        );

        $user->staffProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'staff_no' => 'ADM-' . str_pad(
                    (string) $user->id,
                    4,
                    '0',
                    STR_PAD_LEFT
                ),
                'first_name' => 'Tamahome',
                'last_name' => 'Administrator',
                'department_id' => $department->id,
                'position_id' => $position->id,
                'employment_status' => 'active',
            ]
        );
    }
}
