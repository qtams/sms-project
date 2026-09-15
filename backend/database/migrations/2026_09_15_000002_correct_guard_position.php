<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('positions')->where('code', 'SECURITY_GUARD')->update([
            'code' => 'GUARD',
            'name' => 'Guard',
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('positions')->where('code', 'GUARD')->update([
            'code' => 'SECURITY_GUARD',
            'name' => 'Security Guard',
            'updated_at' => now(),
        ]);
    }
};
