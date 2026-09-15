<?php

namespace Tests\Feature;

use App\Models\AcademicProgram;
use App\Models\AcademicUnit;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicSetupHierarchyTest extends TestCase
{
    use RefreshDatabase;

    public function test_clean_hierarchy_is_seeded_with_normalized_parent_relationships(): void
    {
        $basic = AcademicUnit::where('code', 'BED')->firstOrFail();
        $higher = AcademicUnit::where('code', 'HED')->firstOrFail();
        $seniorHigh = AcademicUnit::where('code', 'SHS')->firstOrFail();
        $engineering = AcademicUnit::where('code', 'COE')->firstOrFail();

        $this->assertNull($basic->parent_id);
        $this->assertNull($higher->parent_id);
        $this->assertSame($basic->id, $seniorHigh->parent_id);
        $this->assertSame('department', $seniorHigh->type);
        $this->assertSame($higher->id, $engineering->parent_id);
        $this->assertSame('college', $engineering->type);

        $academicTrack = AcademicProgram::where('code', 'ACAD-TRACK')->firstOrFail();
        $this->assertSame($seniorHigh->id, $academicTrack->academic_unit_id);
        $this->assertNull($academicTrack->parent_id);
    }

    public function test_api_rejects_an_invalid_college_parent(): void
    {
        $administrator = User::factory()->create(['role_id' => Role::idFor(Role::ADMIN)]);
        $basic = AcademicUnit::where('code', 'BED')->firstOrFail();

        $this->actingAs($administrator)->postJson('/api/academic-setup/academic-units', [
            'parent_id' => $basic->id,
            'code' => 'INVALID-COLLEGE',
            'name' => 'Invalid College',
            'type' => 'college',
            'education_level' => 'higher_education',
            'is_active' => true,
        ])->assertUnprocessable();
    }

    public function test_api_creates_a_strand_only_under_a_track(): void
    {
        $administrator = User::factory()->create(['role_id' => Role::idFor(Role::ADMIN)]);
        $seniorHigh = AcademicUnit::where('code', 'SHS')->firstOrFail();
        $academicTrack = AcademicProgram::where('code', 'ACAD-TRACK')->firstOrFail();

        $this->actingAs($administrator)->postJson('/api/academic-setup/academic-programs', [
            'academic_unit_id' => $seniorHigh->id,
            'parent_id' => $academicTrack->id,
            'code' => 'HUMSS',
            'name' => 'Humanities and Social Sciences',
            'program_type' => 'strand',
            'is_active' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('academic_programs', [
            'code' => 'HUMSS',
            'parent_id' => $academicTrack->id,
            'academic_unit_id' => $seniorHigh->id,
        ]);
    }
}
