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
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_code')->nullable()->unique()->after('id');
            $table->string('mobile', 11)->nullable()->after('email');
            $table->date('birthday')->nullable()->after('mobile');
            $table->string('department')->nullable()->after('birthday');
            $table->string('position')->nullable()->after('department');
            $table->string('rfid')->nullable()->unique()->after('position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['user_code']);
            $table->dropUnique(['rfid']);

            $table->dropColumn([
                'user_code',
                'mobile',
                'birthday',
                'department',
                'position',
                'rfid',
            ]);
        });
    }
};
