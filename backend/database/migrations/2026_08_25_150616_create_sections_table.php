<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('grade_level_id')
                ->constrained('grade_levels')
                ->restrictOnDelete();

            $table->foreignId('school_year_id')
                ->constrained('school_years')
                ->restrictOnDelete();

            $table->string('name', 100);

            $table->unsignedSmallInteger('capacity')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'grade_level_id',
                'school_year_id',
            ]);
            $table->unique(['grade_level_id', 'school_year_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
