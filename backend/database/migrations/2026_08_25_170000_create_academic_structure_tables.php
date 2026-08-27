<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('academic_units')->restrictOnDelete();
            $table->string('code', 30)->unique();
            $table->string('name', 150);
            $table->string('type', 30);
            $table->string('education_level', 30);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['parent_id', 'name']);
        });

        Schema::create('academic_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_unit_id')->constrained()->restrictOnDelete();
            $table->string('code', 30)->unique();
            $table->string('name', 150);
            $table->string('program_type', 30)->default('program');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['academic_unit_id', 'name']);
        });

        Schema::table('grade_levels', function (Blueprint $table) {
            $table->foreignId('academic_unit_id')->nullable()->after('department_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_program_id')->nullable()->after('academic_unit_id')->constrained()->restrictOnDelete();
        });

        $now = now();
        $departments = DB::table('grade_levels')
            ->join('departments', 'departments.id', '=', 'grade_levels.department_id')
            ->select('departments.id', 'departments.code', 'departments.name')
            ->distinct()->get();

        foreach ($departments as $department) {
            $unitId = DB::table('academic_units')->insertGetId([
                'code' => 'LEGACY-'.$department->code,
                'name' => $department->name,
                'type' => 'department',
                'education_level' => 'basic',
                'description' => 'Migrated from the legacy grade-level department assignment.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('grade_levels')->where('department_id', $department->id)->update(['academic_unit_id' => $unitId]);
        }

        Schema::table('grade_levels', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->change();
            $table->unique(['academic_unit_id', 'academic_program_id', 'name'], 'grade_levels_academic_scope_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('grade_levels', function (Blueprint $table) {
            $table->dropUnique('grade_levels_academic_scope_name_unique');
            $table->dropConstrainedForeignId('academic_program_id');
            $table->dropConstrainedForeignId('academic_unit_id');
        });
        Schema::dropIfExists('academic_programs');
        Schema::dropIfExists('academic_units');
    }
};
