<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use App\Models\AcademicUnit;
use App\Models\GradeLevel;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicSetupController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'schoolYears' => SchoolYear::query()->withCount('sections')->orderByDesc('start_date')->orderByDesc('id')->get(),
            'academicUnits' => AcademicUnit::query()->with('parent:id,name')->withCount(['children', 'programs', 'gradeLevels'])->orderBy('education_level')->orderBy('name')->get(),
            'academicPrograms' => AcademicProgram::query()->with('academicUnit:id,parent_id,code,name,type,education_level')->withCount('gradeLevels')->orderBy('name')->get(),
            'gradeLevels' => GradeLevel::query()->with(['academicUnit:id,parent_id,code,name,type,education_level', 'academicProgram:id,academic_unit_id,code,name,program_type'])->withCount('sections')->orderBy('sort_order')->orderBy('name')->get(),
            'sections' => Section::query()->with([
                'gradeLevel:id,academic_unit_id,academic_program_id,name,sort_order,is_active',
                'gradeLevel.academicUnit:id,parent_id,code,name,type,education_level',
                'gradeLevel.academicProgram:id,academic_unit_id,code,name,program_type',
                'schoolYear:id,name,start_date,end_date,is_active',
                'teachers:id,username,email',
                'teachers.staffProfile:id,user_id,first_name,middle_name,last_name,suffix,employment_status',
            ])->latest()->get(),
            'teachers' => User::query()->where('role', 'teacher')->where('is_active', true)
                ->with('staffProfile:id,user_id,first_name,middle_name,last_name,suffix,employment_status')
                ->orderBy('username')->get(['id', 'username', 'email']),
        ]);
    }

    public function storeAcademicUnit(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        return response()->json(AcademicUnit::create($this->validateAcademicUnit($request))->load('parent:id,name'), 201);
    }

    public function updateAcademicUnit(Request $request, AcademicUnit $academicUnit): JsonResponse
    {
        $this->authorizeAdmin($request);
        $academicUnit->update($this->validateAcademicUnit($request, $academicUnit));
        return response()->json($academicUnit->fresh()->load('parent:id,name'));
    }

    private function validateAcademicUnit(Request $request, ?AcademicUnit $academicUnit = null): array
    {
        return $request->validate([
            'parent_id' => ['nullable', 'integer', Rule::exists('academic_units', 'id')->whereNull('deleted_at'), Rule::notIn(array_filter([$academicUnit?->id]))],
            'code' => ['required', 'string', 'max:30', Rule::unique('academic_units', 'code')->ignore($academicUnit)],
            'name' => ['required', 'string', 'max:150', Rule::unique('academic_units', 'name')->where(fn ($query) => $query->where('parent_id', $request->input('parent_id')))->ignore($academicUnit)],
            'type' => ['required', Rule::in(['division', 'college', 'department'])],
            'education_level' => ['required', Rule::in(['basic', 'higher_education'])],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    public function destroyAcademicUnit(Request $request, AcademicUnit $academicUnit): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_if($academicUnit->children()->exists() || $academicUnit->programs()->exists() || $academicUnit->gradeLevels()->exists(), 422, 'This academic unit is in use and cannot be deleted.');
        $academicUnit->delete();
        return response()->json(status: 204);
    }

    public function storeAcademicProgram(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        return response()->json(AcademicProgram::create($this->validateAcademicProgram($request))->load('academicUnit:id,code,name,type,education_level'), 201);
    }

    public function updateAcademicProgram(Request $request, AcademicProgram $academicProgram): JsonResponse
    {
        $this->authorizeAdmin($request);
        $academicProgram->update($this->validateAcademicProgram($request, $academicProgram));
        return response()->json($academicProgram->fresh()->load('academicUnit:id,code,name,type,education_level'));
    }

    private function validateAcademicProgram(Request $request, ?AcademicProgram $academicProgram = null): array
    {
        return $request->validate([
            'academic_unit_id' => ['required', 'integer', Rule::exists('academic_units', 'id')->whereNull('deleted_at')],
            'code' => ['required', 'string', 'max:30', Rule::unique('academic_programs', 'code')->ignore($academicProgram)],
            'name' => ['required', 'string', 'max:150', Rule::unique('academic_programs', 'name')->where(fn ($query) => $query->where('academic_unit_id', $request->integer('academic_unit_id')))->ignore($academicProgram)],
            'program_type' => ['required', Rule::in(['program', 'track', 'strand'])],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    public function destroyAcademicProgram(Request $request, AcademicProgram $academicProgram): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_if($academicProgram->gradeLevels()->exists(), 422, 'This program or track has grade levels and cannot be deleted.');
        $academicProgram->delete();
        return response()->json(status: 204);
    }

    public function storeSchoolYear(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', Rule::unique('school_years', 'name')],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        return response()->json(SchoolYear::create($data), 201);
    }

    public function updateSchoolYear(Request $request, SchoolYear $schoolYear): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', Rule::unique('school_years', 'name')->ignore($schoolYear)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'is_active' => ['required', 'boolean'],
        ]);
        $schoolYear->update($data);
        return response()->json($schoolYear->fresh()->loadCount('sections'));
    }

    public function destroySchoolYear(Request $request, SchoolYear $schoolYear): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_if($schoolYear->sections()->exists(), 422, 'This school year has sections and cannot be deleted.');
        $schoolYear->delete();
        return response()->json(status: 204);
    }

    public function storeGradeLevel(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $this->validateGradeLevel($request);
        return response()->json(GradeLevel::create($data)->load(['academicUnit:id,code,name,type,education_level', 'academicProgram:id,code,name,program_type']), 201);
    }

    public function updateGradeLevel(Request $request, GradeLevel $gradeLevel): JsonResponse
    {
        $this->authorizeAdmin($request);
        $gradeLevel->update($this->validateGradeLevel($request, $gradeLevel));
        return response()->json($gradeLevel->fresh()->load(['academicUnit:id,code,name,type,education_level', 'academicProgram:id,code,name,program_type'])->loadCount('sections'));
    }

    private function validateGradeLevel(Request $request, ?GradeLevel $gradeLevel = null): array
    {
        return $request->validate([
            'academic_unit_id' => ['required', 'integer', Rule::exists('academic_units', 'id')->whereNull('deleted_at')],
            'academic_program_id' => ['nullable', 'integer', Rule::exists('academic_programs', 'id')->where(fn ($query) => $query->where('academic_unit_id', $request->integer('academic_unit_id'))->whereNull('deleted_at'))],
            'name' => ['required', 'string', 'max:100', Rule::unique('grade_levels')->where(fn ($query) => $query->where('academic_unit_id', $request->integer('academic_unit_id'))->where('academic_program_id', $request->input('academic_program_id')))->ignore($gradeLevel)],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    public function destroyGradeLevel(Request $request, GradeLevel $gradeLevel): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_if($gradeLevel->sections()->exists(), 422, 'This grade level has sections and cannot be deleted.');
        $gradeLevel->delete();
        return response()->json(status: 204);
    }

    public function storeSection(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);
        $section = Section::create($this->validateSection($request));
        return response()->json($this->loadSection($section), 201);
    }

    public function updateSection(Request $request, Section $section): JsonResponse
    {
        $this->authorizeAdmin($request);
        $section->update($this->validateSection($request, $section));
        return response()->json($this->loadSection($section->fresh()));
    }

    private function validateSection(Request $request, ?Section $section = null): array
    {
        return $request->validate([
            'grade_level_id' => ['required', 'integer', Rule::exists('grade_levels', 'id')->whereNull('deleted_at')],
            'school_year_id' => ['required', 'integer', Rule::exists('school_years', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:100', Rule::unique('sections')->where(fn ($q) => $q
                ->where('grade_level_id', $request->integer('grade_level_id'))
                ->where('school_year_id', $request->integer('school_year_id')))->ignore($section)],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    public function destroySection(Request $request, Section $section): JsonResponse
    {
        $this->authorizeAdmin($request);
        $section->teachers()->detach();
        $section->delete();
        return response()->json(status: 204);
    }

    public function syncTeachers(Request $request, Section $section): JsonResponse
    {
        $this->authorizeAdmin($request);
        $data = $request->validate(['teacher_ids' => ['present', 'array'], 'teacher_ids.*' => ['integer', 'distinct']]);
        $validIds = User::query()->where('role', 'teacher')->where('is_active', true)
            ->whereIn('id', $data['teacher_ids'])->pluck('id');
        abort_if($validIds->count() !== count($data['teacher_ids']), 422, 'Every selected user must be an active teacher.');
        $section->teachers()->sync($validIds);
        return response()->json($this->loadSection($section));
    }

    private function loadSection(Section $section): Section
    {
        return $section->load(['gradeLevel.academicUnit:id,code,name,type,education_level', 'gradeLevel.academicProgram:id,code,name,program_type', 'schoolYear:id,name,start_date,end_date,is_active', 'teachers.staffProfile']);
    }
}
