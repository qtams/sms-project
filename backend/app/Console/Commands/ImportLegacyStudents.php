<?php

namespace App\Console\Commands;

use App\Models\AcademicProgram;
use App\Models\AcademicUnit;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\RfidAssignment;
use App\Models\RfidCard;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class ImportLegacyStudents extends Command
{
    protected $signature = 'attendance:import-legacy-students {--database=ebenezer_databases}';

    protected $description = 'Import legacy students and RFID assignments into the normalized attendance tables';

    public function handle(): int
    {
        $database = (string) $this->option('database');

        if (! preg_match('/^[A-Za-z0-9_]+$/', $database)) {
            $this->error('The legacy database name contains invalid characters.');

            return self::FAILURE;
        }

        try {
            $legacyStudents = DB::table("{$database}.students")->get();
        } catch (Throwable $error) {
            $this->error("Unable to read {$database}.students: {$error->getMessage()}");

            return self::FAILURE;
        }

        $schoolYear = SchoolYear::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($query) => $query->whereNull('end_date')->orWhereDate('end_date', '>=', today()))
            ->orderByDesc('start_date')
            ->first()
            ?? SchoolYear::query()->where('is_active', true)->orderBy('id')->first();

        if (! $schoolYear) {
            $this->error('Create an active school year before importing legacy students.');

            return self::FAILURE;
        }

        $unit = AcademicUnit::query()->firstOrCreate(
            ['code' => 'LEGACY-HE'],
            ['name' => 'Legacy Higher Education', 'type' => 'college', 'education_level' => 'higher_education', 'description' => 'Imported legacy student placements.', 'is_active' => true],
        );

        $imported = 0;
        foreach ($legacyStudents as $legacy) {
            DB::transaction(function () use ($legacy, $schoolYear, $unit, &$imported) {
                $student = Student::query()->updateOrCreate(
                    ['student_no' => trim((string) $legacy->student_id)],
                    [
                        'first_name' => trim((string) $legacy->firstname),
                        'middle_name' => trim((string) ($legacy->middle_ini ?? '')) ?: null,
                        'last_name' => trim((string) $legacy->lastname),
                        'email' => trim((string) ($legacy->email ?? '')) ?: null,
                        'status' => strcasecmp((string) $legacy->status, 'active') === 0 ? 'active' : 'inactive',
                    ],
                );

                $programName = trim((string) ($legacy->department ?? '')) ?: 'Legacy Program';
                $program = AcademicProgram::query()->firstOrCreate(
                    ['academic_unit_id' => $unit->id, 'name' => $programName],
                    ['code' => 'LEG-'.strtoupper(substr(sha1($programName), 0, 8)), 'program_type' => 'program', 'description' => 'Imported from the legacy student table.', 'is_active' => true],
                );
                $levelName = trim((string) ($legacy->level ?? '')) ?: 'Unspecified Level';
                $gradeLevel = GradeLevel::query()->firstOrCreate(
                    ['academic_unit_id' => $unit->id, 'academic_program_id' => $program->id, 'name' => $levelName],
                    ['sort_order' => $this->levelSortOrder($levelName), 'is_active' => true],
                );
                $sectionName = trim((string) ($legacy->course_section ?? '')) ?: 'Unassigned';
                $section = Section::query()->firstOrCreate(
                    ['grade_level_id' => $gradeLevel->id, 'school_year_id' => $schoolYear->id, 'name' => $sectionName],
                    ['is_active' => true],
                );

                Enrollment::query()->updateOrCreate(
                    ['student_id' => $student->id, 'school_year_id' => $schoolYear->id],
                    ['grade_level_id' => $gradeLevel->id, 'section_id' => $section->id, 'enrolled_at' => $schoolYear->start_date ?? today(), 'status' => $student->status === 'active' ? 'enrolled' : 'withdrawn'],
                );

                $uid = Str::of((string) ($legacy->rfid ?? ''))->replaceMatches('/[^A-Za-z0-9]/', '')->toString();
                if ($uid !== '') {
                    $card = RfidCard::query()->updateOrCreate(
                        ['uid' => $uid],
                        ['status' => $student->status === 'active' ? 'active' : 'inactive', 'issued_at' => $legacy->created_at ?? now()],
                    );
                    RfidAssignment::query()->firstOrCreate(
                        ['rfid_card_id' => $card->id, 'student_id' => $student->id, 'ends_at' => null],
                        ['starts_at' => $legacy->created_at ?? now(), 'reason' => 'Imported from legacy student record'],
                    );
                }

                $imported++;
            });
        }

        $this->info("Imported or updated {$imported} student(s) for school year {$schoolYear->name}.");

        return self::SUCCESS;
    }

    private function levelSortOrder(string $level): int
    {
        preg_match('/\d+/', $level, $matches);

        return isset($matches[0]) ? (int) $matches[0] : 0;
    }
}
