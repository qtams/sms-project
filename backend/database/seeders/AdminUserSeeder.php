<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'Sprytech'],
            [
                'name' => 'SPRYtech Administrator',
                'email' => 'sprytechmail@gmail.com',
                'password' => env('ADMIN_INITIAL_PASSWORD'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }
}
