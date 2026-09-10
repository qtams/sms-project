<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('guardian_name')->nullable()->after('address');
            $table->string('guardian_relationship', 100)->nullable()->after('guardian_name');
            $table->string('guardian_contact', 30)->nullable()->after('guardian_relationship');
            $table->string('guardian_email')->nullable()->after('guardian_contact');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['guardian_name', 'guardian_relationship', 'guardian_contact', 'guardian_email']);
        });
    }
};
