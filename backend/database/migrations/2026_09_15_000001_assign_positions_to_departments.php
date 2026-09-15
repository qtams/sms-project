<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->foreignId('department_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
            $table->index(['department_id', 'is_active']);
        });

        $now = now();
        $administrationId = DB::table('departments')->where('code', 'ADMIN')->value('id');
        $registrationId = DB::table('departments')->where('code', 'REG')->value('id');
        $securityId = DB::table('departments')->where('code', 'SEC')->value('id');

        if ($registrationId) {
            DB::table('departments')->where('id', $registrationId)->update([
                'name' => 'Registration',
                'updated_at' => $now,
            ]);
        }

        DB::table('positions')->whereNull('department_id')->update([
            'department_id' => DB::raw('(SELECT MIN(staff_profiles.department_id) FROM staff_profiles WHERE staff_profiles.position_id = positions.id)'),
        ]);

        $upsertPosition = function (string $code, string $name, ?int $departmentId) use ($now): void {
            if (! $departmentId) {
                return;
            }

            $positionId = DB::table('positions')
                ->where('code', $code)
                ->orWhere('name', $name)
                ->value('id');

            if ($positionId) {
                DB::table('positions')->where('id', $positionId)->update([
                    'code' => $code,
                    'name' => $name,
                    'department_id' => $departmentId,
                    'is_active' => true,
                    'updated_at' => $now,
                ]);

                return;
            }

            DB::table('positions')->insert([
                'code' => $code,
                'name' => $name,
                'department_id' => $departmentId,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        };

        $upsertPosition('SUPER_ADMIN', 'Super Admin', $administrationId);
        $upsertPosition('SYS_ADMIN', 'System Administrator', $administrationId);
        $upsertPosition('REGISTRAR', 'Registrar', $registrationId);
        $upsertPosition('GUARD', 'Guard', $securityId);
    }

    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropIndex(['department_id', 'is_active']);
            $table->dropColumn('department_id');
        });

        DB::table('departments')->where('code', 'REG')->update([
            'name' => 'Registrar',
            'updated_at' => now(),
        ]);
    }
};
