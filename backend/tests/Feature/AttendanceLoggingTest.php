<?php

namespace Tests\Feature;

use App\Models\AcademicUnit;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\RfidAssignment;
use App\Models\RfidCard;
use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AttendanceLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_rfid_scan_records_attendance_against_the_student_enrollment(): void
    {
        [$user, $student, $enrollment] = $this->attendanceFixture();
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-08 07:30:00', 'Asia/Manila'));

        $this->actingAs($user)->postJson('/api/attendance/scan', ['rfid_uid' => 'RFID-TEST-001'])
            ->assertOk()
            ->assertJsonPath('action', 'check-in')
            ->assertJsonPath('student.id', $student->id)
            ->assertJsonPath('student.student_id', '20260000001');

        $this->assertDatabaseHas('attendance_records', [
            'enrollment_id' => $enrollment->id,
            'attendance_date' => '2026-09-08',
            'status' => 'present',
        ]);
        $this->assertDatabaseHas('rfid_scan_events', ['student_id' => $student->id, 'event_type' => 'check_in', 'result' => 'success']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-08 16:30:00', 'Asia/Manila'));
        $this->actingAs($user)->postJson('/api/attendance/scan', ['rfid_uid' => 'RFID-TEST-001'])
            ->assertOk()
            ->assertJsonPath('action', 'check-out');

        $this->assertDatabaseHas('rfid_scan_events', ['student_id' => $student->id, 'event_type' => 'check_out', 'result' => 'success']);

        $this->actingAs($user)->getJson('/api/attendance?date=2026-09-08')
            ->assertOk()
            ->assertJsonPath('records.0.studentProfileId', $student->id)
            ->assertJsonPath('records.0.studentId', '20260000001')
            ->assertJsonPath('records.0.status', 'Present');

        $this->actingAs($user)->getJson('/api/attendance/students/20260000001')
            ->assertOk()
            ->assertJsonPath('student.id', $student->id)
            ->assertJsonPath('records.0.enrollmentId', $enrollment->id);

        $this->actingAs($user)->getJson('/api/students')
            ->assertOk()
            ->assertJsonPath('students.0.id', $student->id)
            ->assertJsonPath('students.0.rfid', 'RFID-TEST-001');

        $this->actingAs($user)->getJson('/api/attendance/history')
            ->assertOk()
            ->assertJsonPath('records.0.studentId', '20260000001')
            ->assertJsonPath('records.0.status', 'Complete');
    }

    public function test_manual_status_update_is_audited(): void
    {
        [$user, , $enrollment] = $this->attendanceFixture();

        $response = $this->actingAs($user)->postJson('/api/attendance/records/status', [
            'enrollment_id' => $enrollment->id,
            'date' => '2026-09-08',
            'status' => 'excused',
            'reason' => 'Approved school activity.',
        ])->assertOk()->assertJsonPath('record.status', 'excused');

        $this->assertDatabaseHas('attendance_corrections', [
            'attendance_record_id' => $response->json('record.id'),
            'performed_by' => $user->id,
            'new_status' => 'excused',
            'reason' => 'Approved school activity.',
        ]);
    }

    public function test_unknown_rfid_is_rejected_and_logged(): void
    {
        [$user] = $this->attendanceFixture();

        $this->actingAs($user)->postJson('/api/attendance/scan', ['rfid_uid' => 'UNKNOWN-CARD'])
            ->assertNotFound()
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('rfid_scan_events', ['scanned_uid' => 'UNKNOWN-CARD', 'event_type' => 'unknown_card', 'result' => 'rejected']);
    }

    public function test_successful_check_in_sends_sms_to_the_students_mobile_number(): void
    {
        config()->set('services.unisms', [
            'enabled' => true,
            'base_url' => 'https://unismsapi.com/api',
            'secret_key' => 'test-secret',
            'sender_id' => 'Unisoft',
            'recipient' => 'student',
        ]);
        Http::fake([
            'unismsapi.com/api/sms' => Http::response([
                'message' => [
                    'reference_id' => 'msg_test_123',
                    'status' => 'sent',
                    'fail_reason' => null,
                ],
            ], 201),
        ]);

        [$user, $student] = $this->attendanceFixture();
        $student->update(['mobile' => '09274158625']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-08 07:30:00', 'Asia/Manila'));

        $this->actingAs($user)
            ->postJson('/api/attendance/manual', ['student_no' => $student->student_no])
            ->assertOk()
            ->assertJsonPath('action', 'check-in');

        Http::assertSent(fn ($request) =>
            $request->url() === 'https://unismsapi.com/api/sms'
            && $request['recipient'] === '+639274158625'
            && $request['sender_id'] === 'Unisoft'
            && $request['metadata']['event'] === 'student_check_in'
        );
        $this->assertDatabaseHas('sms_notifications', [
            'student_id' => $student->id,
            'recipient' => '+639274158625',
            'provider_reference_id' => 'msg_test_123',
            'status' => 'sent',
        ]);
    }

    private function attendanceFixture(): array
    {
        $user = User::factory()->create(['role_id' => Role::idFor(Role::ADMIN)]);
        $unit = AcademicUnit::create(['code' => 'JHS-TEST', 'name' => 'Junior High School Test', 'type' => 'division', 'education_level' => 'basic', 'is_active' => true]);
        $schoolYear = SchoolYear::create(['name' => '2026-2027', 'start_date' => '2026-06-01', 'end_date' => '2027-03-31', 'is_active' => true]);
        $grade = GradeLevel::create(['academic_unit_id' => $unit->id, 'name' => 'Grade 7', 'sort_order' => 7, 'is_active' => true]);
        $section = Section::create(['grade_level_id' => $grade->id, 'school_year_id' => $schoolYear->id, 'name' => 'A', 'capacity' => 40, 'is_active' => true]);
        $student = Student::create(['student_no' => '20260000001', 'first_name' => 'Juan', 'middle_name' => 'Dela', 'last_name' => 'Cruz', 'status' => 'active']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'school_year_id' => $schoolYear->id, 'grade_level_id' => $grade->id, 'section_id' => $section->id, 'enrolled_at' => '2026-06-01', 'status' => 'enrolled']);
        $card = RfidCard::create(['uid' => 'RFID-TEST-001', 'status' => 'active', 'issued_at' => now()]);
        RfidAssignment::create(['rfid_card_id' => $card->id, 'student_id' => $student->id, 'starts_at' => '2026-01-01 00:00:00']);

        return [$user, $student, $enrollment];
    }
}
