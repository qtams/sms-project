<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            $table->foreignId('attendance_record_id')->constrained()->restrictOnDelete();
            $table->string('recipient', 30);
            $table->string('content', 670);
            $table->string('provider', 30)->default('unisms');
            $table->string('provider_reference_id')->nullable()->index();
            $table->string('status', 30)->default('pending')->index();
            $table->text('failure_reason')->nullable();
            $table->json('provider_response')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->unique(['attendance_record_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_notifications');
    }
};
