<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ROLES = [
        'admin' => 'Administrator',
        'registrar' => 'Registrar',
        'guard' => 'Guard',
        'teacher_admin' => 'Teacher Administrator',
        'teacher' => 'Teacher',
        'student' => 'Student',
    ];

    public function up(): void
    {
        // Preserve installations seeded with the original "administrator" slug.
        if (DB::table('roles')->where('slug', 'administrator')->exists()
            && ! DB::table('roles')->where('slug', 'admin')->exists()) {
            DB::table('roles')->where('slug', 'administrator')->update([
                'slug' => 'admin',
                'updated_at' => now(),
            ]);
        }

        foreach (self::ROLES as $slug => $name) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $slug],
                ['name' => $name, 'updated_at' => now(), 'created_at' => now()],
            );
        }

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('password')->constrained()->restrictOnDelete();
        });

        foreach (DB::table('users')->select('id', 'role')->get() as $user) {
            $roleId = DB::table('roles')->where('slug', $user->role)->value('id');

            if ($roleId === null) {
                throw new RuntimeException("Cannot migrate user {$user->id}: unknown role '{$user->role}'.");
            }

            DB::table('users')->where('id', $user->id)->update(['role_id' => $roleId]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable(false)->change();
            $table->dropColumn('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable()->after('password');
        });

        foreach (DB::table('users')->select('id', 'role_id')->get() as $user) {
            DB::table('users')->where('id', $user->id)->update([
                'role' => DB::table('roles')->where('id', $user->role_id)->value('slug'),
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable(false)->change();
            $table->dropConstrainedForeignId('role_id');
        });
    }
};
