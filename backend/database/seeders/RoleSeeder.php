<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ([
            Role::ADMIN => 'Administrator',
            Role::REGISTRAR => 'Registrar',
            Role::GUARD => 'Guard',
            Role::TEACHER_ADMIN => 'Teacher Administrator',
            Role::TEACHER => 'Teacher',
            Role::STUDENT => 'Student',
        ] as $slug => $name) {
            Role::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }
    }
}
