<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('section_teacher') && ! Schema::hasTable('section_teachers')) {
            Schema::rename('section_teacher', 'section_teachers');
        }

        if (Schema::hasTable('section_teachers')
            && Schema::hasColumn('section_teachers', 'user_id')
            && ! Schema::hasColumn('section_teachers', 'teacher_id')) {
            Schema::table('section_teachers', function (Blueprint $table) {
                $table->renameColumn('user_id', 'teacher_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('section_teachers')
            && Schema::hasColumn('section_teachers', 'teacher_id')
            && ! Schema::hasColumn('section_teachers', 'user_id')) {
            Schema::table('section_teachers', function (Blueprint $table) {
                $table->renameColumn('teacher_id', 'user_id');
            });
        }

        if (Schema::hasTable('section_teachers') && ! Schema::hasTable('section_teacher')) {
            Schema::rename('section_teachers', 'section_teacher');
        }
    }
};
