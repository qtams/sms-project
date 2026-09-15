<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_programs', function (Blueprint $table) {
            $table->foreignId('parent_id')
                ->nullable()
                ->after('academic_unit_id')
                ->constrained('academic_programs')
                ->restrictOnDelete();
        });

        DB::transaction(function (): void {
            $now = now();
            $basicId = $this->upsertUnit(null, 'BED', 'Basic Education', 'division', 'basic', $now);
            $higherId = $this->upsertUnit(null, 'HED', 'Higher Education', 'division', 'higher_education', $now);
            $elementaryId = $this->upsertUnit($basicId, 'ELEM', 'Elementary', 'department', 'basic', $now);
            $juniorHighId = $this->upsertUnit($basicId, 'JHS', 'Junior High School', 'department', 'basic', $now);
            $seniorHighId = $this->upsertUnit($basicId, 'SHS', 'Senior High School', 'department', 'basic', $now);
            $this->upsertUnit($higherId, 'COE', 'College of Engineering', 'college', 'higher_education', $now);
            $criminalJusticeId = $this->upsertUnit($higherId, 'CCJE', 'College of Criminal Justice Education', 'college', 'higher_education', $now);

            $criminalJusticeProgramId = DB::table('academic_programs')->where('code', 'LEG-3C23FA0D')->value('id');
            if ($criminalJusticeProgramId) {
                DB::table('academic_programs')->where('id', $criminalJusticeProgramId)->update([
                    'academic_unit_id' => $criminalJusticeId,
                    'code' => 'BSCRIM',
                    'name' => 'Bachelor of Science in Criminology',
                    'program_type' => 'program',
                    'updated_at' => $now,
                ]);
                DB::table('grade_levels')->where('academic_program_id', $criminalJusticeProgramId)->update([
                    'academic_unit_id' => $criminalJusticeId,
                    'updated_at' => $now,
                ]);
            }

            $academicTrackId = $this->upsertOffering($seniorHighId, null, 'ACAD-TRACK', 'Academic Track', 'track', $now);
            $tvlTrackId = $this->upsertOffering($seniorHighId, null, 'TVL-TRACK', 'Technical-Vocational-Livelihood Track', 'track', $now);

            DB::table('academic_programs')->whereIn('code', ['STEM', 'ABM'])->update([
                'academic_unit_id' => $seniorHighId,
                'parent_id' => $academicTrackId,
                'program_type' => 'strand',
                'updated_at' => $now,
            ]);
            DB::table('academic_programs')->where('code', 'CKR')->update([
                'academic_unit_id' => $seniorHighId,
                'parent_id' => $tvlTrackId,
                'program_type' => 'specialization',
                'updated_at' => $now,
            ]);

            $wrongAdministrationUnit = DB::table('academic_units')->where('code', 'LEGACY-ADMIN')->value('id');
            $correctGradeOne = DB::table('grade_levels')
                ->where('academic_unit_id', $elementaryId)
                ->whereNull('academic_program_id')
                ->where('name', 'Grade 1')
                ->value('id');
            $wrongGradeOne = DB::table('grade_levels')
                ->where('academic_unit_id', $wrongAdministrationUnit)
                ->where('name', 'Grade 1')
                ->value('id');

            if ($wrongGradeOne && $correctGradeOne) {
                $duplicateSectionIds = DB::table('sections as wrong')
                    ->join('sections as correct', function ($join) use ($correctGradeOne): void {
                        $join->on('correct.school_year_id', '=', 'wrong.school_year_id')
                            ->on('correct.name', '=', 'wrong.name')
                            ->where('correct.grade_level_id', $correctGradeOne);
                    })
                    ->where('wrong.grade_level_id', $wrongGradeOne)
                    ->pluck('wrong.id');

                DB::table('sections')->whereIn('id', $duplicateSectionIds)->delete();
                DB::table('sections')->where('grade_level_id', $wrongGradeOne)->update(['grade_level_id' => $correctGradeOne]);
                DB::table('enrollments')->where('grade_level_id', $wrongGradeOne)->update(['grade_level_id' => $correctGradeOne]);
                DB::table('grade_levels')->where('id', $wrongGradeOne)->delete();
            }

            $testJuniorHighId = DB::table('academic_units')->where('code', 'TEST-JHS')->value('id');
            if ($testJuniorHighId && $juniorHighId) {
                DB::table('grade_levels')->where('academic_unit_id', $testJuniorHighId)->update([
                    'academic_unit_id' => $juniorHighId,
                    'updated_at' => $now,
                ]);
            }

            DB::table('academic_units')->whereIn('code', ['LEGACY-ADMIN', 'TEST-JHS', 'LEGACY-HE'])->delete();

            $obsoleteYearId = DB::table('school_years')->where('name', '2026-2027')->where('start_date', '2026-01-01')->value('id');
            $canonicalYearId = DB::table('school_years')->where('start_date', '2026-08-15')->value('id');
            if ($obsoleteYearId && $canonicalYearId && $obsoleteYearId !== $canonicalYearId) {
                $obsoleteSections = DB::table('sections')->where('school_year_id', $obsoleteYearId)->get();

                foreach ($obsoleteSections as $obsoleteSection) {
                    $matchingSectionId = DB::table('sections')
                        ->where('school_year_id', $canonicalYearId)
                        ->where('grade_level_id', $obsoleteSection->grade_level_id)
                        ->where('name', $obsoleteSection->name)
                        ->value('id');

                    if ($matchingSectionId) {
                        DB::table('enrollments')->where('section_id', $obsoleteSection->id)->update([
                            'section_id' => $matchingSectionId,
                            'school_year_id' => $canonicalYearId,
                            'updated_at' => $now,
                        ]);

                        $teacherIds = DB::table('section_teachers')->where('section_id', $obsoleteSection->id)->pluck('teacher_id');
                        foreach ($teacherIds as $teacherId) {
                            DB::table('section_teachers')->insertOrIgnore([
                                'section_id' => $matchingSectionId,
                                'teacher_id' => $teacherId,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]);
                        }
                        DB::table('section_teachers')->where('section_id', $obsoleteSection->id)->delete();
                        DB::table('sections')->where('id', $obsoleteSection->id)->delete();
                    } else {
                        DB::table('sections')->where('id', $obsoleteSection->id)->update([
                            'school_year_id' => $canonicalYearId,
                            'updated_at' => $now,
                        ]);
                    }
                }

                DB::table('enrollments')->where('school_year_id', $obsoleteYearId)->update([
                    'school_year_id' => $canonicalYearId,
                    'updated_at' => $now,
                ]);
                DB::table('school_years')->where('id', $obsoleteYearId)->delete();
            }

            DB::table('school_years')->where('start_date', '2026-08-15')->update(['name' => '2026-2027', 'updated_at' => $now]);
            DB::table('school_years')->where('start_date', '2027-06-29')->update(['name' => '2027-2028', 'updated_at' => $now]);

            DB::table('academic_units')->whereIn('id', array_filter([$basicId, $higherId]))->update(['parent_id' => null]);
        });
    }

    public function down(): void
    {
        Schema::table('academic_programs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }

    private function upsertOffering(?int $unitId, ?int $parentId, string $code, string $name, string $type, mixed $now): int
    {
        $id = DB::table('academic_programs')->where('code', $code)->value('id');
        $values = [
            'academic_unit_id' => $unitId,
            'parent_id' => $parentId,
            'name' => $name,
            'program_type' => $type,
            'is_active' => true,
            'updated_at' => $now,
        ];

        if ($id) {
            DB::table('academic_programs')->where('id', $id)->update($values);
            return $id;
        }

        return DB::table('academic_programs')->insertGetId($values + [
            'code' => $code,
            'created_at' => $now,
        ]);
    }

    private function upsertUnit(?int $parentId, string $code, string $name, string $type, string $educationLevel, mixed $now): int
    {
        $id = DB::table('academic_units')->where('code', $code)->value('id');
        $values = [
            'parent_id' => $parentId,
            'name' => $name,
            'type' => $type,
            'education_level' => $educationLevel,
            'is_active' => true,
            'updated_at' => $now,
        ];

        if ($id) {
            DB::table('academic_units')->where('id', $id)->update($values);
            return $id;
        }

        return DB::table('academic_units')->insertGetId($values + [
            'code' => $code,
            'created_at' => $now,
        ]);
    }
};
