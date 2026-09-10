<?php

namespace Database\Seeders;

use App\Models\AcademicUnit;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\RfidAssignment;
use App\Models\RfidCard;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Database\Seeder;

class AttendanceTestStudentSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = SchoolYear::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($query) => $query->whereNull('end_date')->orWhereDate('end_date', '>=', today()))
            ->orderByDesc('start_date')
            ->first()
            ?? SchoolYear::query()->where('is_active', true)->orderBy('id')->firstOrFail();
        $unit = AcademicUnit::query()->firstOrCreate(
            ['code' => 'TEST-JHS'],
            ['name' => 'Test Junior High School', 'type' => 'division', 'education_level' => 'basic', 'description' => 'Academic unit for attendance integration testing.', 'is_active' => true],
        );
        $gradeLevel = GradeLevel::query()->firstOrCreate(
            ['academic_unit_id' => $unit->id, 'academic_program_id' => null, 'name' => 'Grade 7'],
            ['sort_order' => 7, 'is_active' => true],
        );
        $section = Section::query()->firstOrCreate(
            ['grade_level_id' => $gradeLevel->id, 'school_year_id' => $schoolYear->id, 'name' => 'Test Section A'],
            ['capacity' => 40, 'is_active' => true],
        );
        $student = Student::query()->updateOrCreate(
            ['student_no' => '20260000001'],
            [
                'lrn' => '123456789012',
                'first_name' => 'Juan',
                'middle_name' => 'Dela',
                'last_name' => 'Cruz',
                'birth_date' => '2013-05-10',
                'gender' => 'male',
                'email' => 'juan.cruz@example.test',
                'mobile' => '09274158625',
                'address' => 'Cagayan de Oro City',
                'status' => 'active',
            ],
        );

        Enrollment::query()->updateOrCreate(
            ['student_id' => $student->id, 'school_year_id' => $schoolYear->id],
            ['grade_level_id' => $gradeLevel->id, 'section_id' => $section->id, 'enrolled_at' => $schoolYear->start_date ?? today(), 'status' => 'enrolled'],
        );
        $card = RfidCard::query()->updateOrCreate(
            ['uid' => 'TEST0001'],
            ['status' => 'active', 'issued_at' => now()],
        );
        RfidAssignment::query()->firstOrCreate(
            ['rfid_card_id' => $card->id, 'student_id' => $student->id, 'ends_at' => null],
            ['starts_at' => now(), 'reason' => 'Attendance integration test card'],
        );
    }
}
