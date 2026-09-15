<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('academic_programs')->where('code', 'STEM')->update([
            'name' => 'Science, Technology, Engineering and Mathematics',
            'updated_at' => $now,
        ]);

        DB::table('academic_programs')->where('code', 'ABM')->update([
            'name' => 'Accountancy, Business and Management',
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        // Naming corrections are intentionally retained.
    }
};
