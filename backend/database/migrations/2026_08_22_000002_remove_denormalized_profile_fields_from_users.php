<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['user_code']);
            $table->dropUnique(['rfid']);
            $table->dropColumn([
                'user_code', 'first_name', 'last_name', 'name', 'mobile',
                'birthday', 'department', 'position', 'rfid',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->default('')->after('id');
            $table->string('user_code')->nullable()->unique()->after('id');
            $table->string('first_name')->nullable()->after('user_code');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('mobile', 30)->nullable()->after('email');
            $table->date('birthday')->nullable()->after('mobile');
            $table->string('department')->nullable()->after('birthday');
            $table->string('position')->nullable()->after('department');
            $table->string('rfid')->nullable()->unique()->after('position');
        });
    }
};
