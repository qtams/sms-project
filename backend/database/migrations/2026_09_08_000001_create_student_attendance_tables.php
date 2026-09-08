<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_no', 40)->unique();
            $table->string('lrn', 20)->nullable()->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('mobile', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('photo_path', 500)->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['last_name', 'first_name']);
            $table->index('status');
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            $table->foreignId('school_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('grade_level_id')->constrained()->restrictOnDelete();
            $table->foreignId('section_id')->nullable()->constrained()->restrictOnDelete();
            $table->date('enrolled_at')->nullable();
            $table->string('status', 30)->default('enrolled');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['student_id', 'school_year_id']);
            $table->index(['section_id', 'status']);
        });

        Schema::create('rfid_cards', function (Blueprint $table) {
            $table->id();
            $table->string('uid', 100)->unique();
            $table->string('status', 20)->default('active');
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();
        });

        Schema::create('rfid_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfid_card_id')->constrained()->restrictOnDelete();
            $table->foreignId('student_id')->constrained()->restrictOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->string('reason', 255)->nullable();
            $table->timestamps();
            $table->index(['rfid_card_id', 'ends_at']);
            $table->index(['student_id', 'ends_at']);
        });

        Schema::create('rfid_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_code', 100)->unique();
            $table->string('name', 150);
            $table->string('location', 255)->nullable();
            $table->string('secret_hash')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->restrictOnDelete();
            $table->date('attendance_date');
            $table->string('status', 20)->default('present');
            $table->timestamp('first_in_at')->nullable();
            $table->timestamp('last_out_at')->nullable();
            $table->string('source', 20)->default('rfid');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['enrollment_id', 'attendance_date']);
            $table->index(['attendance_date', 'status']);
        });

        Schema::create('rfid_scan_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('event_uuid')->unique();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rfid_card_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('rfid_device_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('attendance_record_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('scanned_uid', 100)->nullable();
            $table->string('event_type', 30);
            $table->string('result', 20);
            $table->string('message', 500)->nullable();
            $table->timestamp('scanned_at');
            $table->timestamp('received_at');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['student_id', 'scanned_at']);
            $table->index(['rfid_card_id', 'scanned_at']);
            $table->index(['rfid_device_id', 'scanned_at']);
        });

        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_record_id')->constrained()->restrictOnDelete();
            $table->foreignId('performed_by')->constrained('users')->restrictOnDelete();
            $table->string('old_status', 20)->nullable();
            $table->string('new_status', 20);
            $table->timestamp('old_first_in_at')->nullable();
            $table->timestamp('new_first_in_at')->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('corrected_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_corrections');
        Schema::dropIfExists('rfid_scan_events');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('rfid_devices');
        Schema::dropIfExists('rfid_assignments');
        Schema::dropIfExists('rfid_cards');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('students');
    }
};
