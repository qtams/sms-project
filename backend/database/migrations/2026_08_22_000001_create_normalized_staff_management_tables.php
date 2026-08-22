<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->restrictOnDelete();
            $table->string('staff_no', 40)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 30)->nullable();
            $table->string('mobile', 30)->nullable();
            $table->text('address')->nullable();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('position_id')->nullable()->constrained()->nullOnDelete();
            $table->string('photo_path', 500)->nullable();
            $table->string('employment_status', 30)->default('active');
            $table->date('hire_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['last_name', 'first_name']);
        });

        $now = now();
        $departmentIds = [];
        foreach (['Administration', 'Registrar', 'Security'] as $name) {
            $departmentIds[$name] = DB::table('departments')->insertGetId([
                'code' => match ($name) {
                    'Administration' => 'ADMIN',
                    'Registrar' => 'REG',
                    default => 'SEC',
                },
                'name' => $name,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $users = DB::table('users')
            ->whereIn('role', ['admin', 'registrar', 'guard'])
            ->orderBy('id')
            ->get();

        foreach ($users as $user) {
            $departmentId = null;
            if (! empty($user->department)) {
                $departmentId = $departmentIds[$user->department] ?? DB::table('departments')->insertGetId([
                    'code' => 'LEGACY-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
                    'name' => $user->department,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $departmentIds[$user->department] = $departmentId;
            }

            $positionId = null;
            if (! empty($user->position)) {
                $positionId = DB::table('positions')->where('name', $user->position)->value('id');
                $positionId ??= DB::table('positions')->insertGetId([
                    'code' => 'LEGACY-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
                    'name' => $user->position,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $nameParts = preg_split('/\s+/', trim((string) $user->name), 2);
            $prefix = match ($user->role) {
                'admin' => 'ADM',
                'registrar' => 'REG',
                default => 'GRD',
            };

            DB::table('staff_profiles')->insert([
                'user_id' => $user->id,
                'staff_no' => $user->user_code ?: $prefix.'-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
                'first_name' => $user->first_name ?: ($nameParts[0] ?? 'Unknown'),
                'last_name' => $user->last_name ?: ($nameParts[1] ?? 'Unknown'),
                'birth_date' => $user->birthday,
                'mobile' => $user->mobile,
                'department_id' => $departmentId,
                'position_id' => $positionId,
                'employment_status' => $user->is_active ? 'active' : 'inactive',
                'created_at' => $user->created_at ?: $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_profiles');
        Schema::dropIfExists('positions');
        Schema::dropIfExists('departments');
    }
};
