<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DirectoryController extends Controller
{
    public function student(Student $student): JsonResponse
    {
        return response()->json(['student' => $this->studentPayload($student)]);
    }

    public function updateStudent(Request $request, Student $student): JsonResponse
    {
        $data = $request->validate([
            'firstName' => ['required', 'string', 'max:100'],
            'middleName' => ['nullable', 'string', 'max:100'],
            'lastName' => ['required', 'string', 'max:100'],
            'birthDate' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'status' => ['required', Rule::in(['Enrolled', 'Unenrolled', 'Inactive'])],
            'email' => ['nullable', 'email', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:2000'],
            'guardianName' => ['nullable', 'string', 'max:255'],
            'relationship' => ['nullable', 'string', 'max:100'],
            'guardianContact' => ['nullable', 'string', 'max:30'],
            'guardianEmail' => ['nullable', 'email', 'max:255'],
        ]);

        $student->update([
            'first_name' => $data['firstName'],
            'middle_name' => $data['middleName'] ?? null,
            'last_name' => $data['lastName'],
            'birth_date' => $data['birthDate'] ?? null,
            'gender' => strtolower($data['gender'] ?? ''),
            'email' => $data['email'] ?? null,
            'mobile' => $data['mobile'] ?? null,
            'address' => $data['address'] ?? null,
            'guardian_name' => $data['guardianName'] ?? null,
            'guardian_relationship' => $data['relationship'] ?? null,
            'guardian_contact' => $data['guardianContact'] ?? null,
            'guardian_email' => $data['guardianEmail'] ?? null,
            'status' => $data['status'] === 'Inactive' ? 'inactive' : 'active',
        ]);

        if ($data['status'] !== 'Inactive') {
            $student->enrollments()->latest('id')->first()?->update([
                'status' => $data['status'] === 'Enrolled' ? 'enrolled' : 'unenrolled',
            ]);
        }

        return response()->json([
            'message' => 'Student details updated.',
            'student' => $this->studentPayload($student->fresh()),
        ]);
    }

    public function students(): JsonResponse
    {
        $students = Student::query()
            ->with(['enrollments' => fn ($query) => $query->with(['gradeLevel:id,name', 'section:id,name'])->latest('id'), 'rfidAssignments' => fn ($query) => $query->whereNull('ends_at')->with('card:id,uid,status')->latest('starts_at')])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(function (Student $student) {
                $enrollment = $student->enrollments->first();
                $assignment = $student->rfidAssignments->first();

                return [
                    'id' => $student->id,
                    'studentId' => $student->student_no,
                    'rfid' => $assignment?->card?->uid ?? '',
                    'firstName' => $student->first_name,
                    'middleName' => $student->middle_name ?? '',
                    'lastName' => $student->last_name,
                    'gradeLevel' => $enrollment?->gradeLevel?->name ?? 'Unassigned',
                    'section' => $enrollment?->section?->name ?? 'Unassigned',
                    'birthDate' => $student->birth_date?->format('Y-m-d') ?? '',
                    'guardianName' => '',
                    'guardianContact' => '',
                    'address' => $student->address ?? '',
                    'status' => match ($student->status) {
                        'active' => $enrollment?->status === 'enrolled' ? 'Enrolled' : 'Unenrolled',
                        default => 'Inactive',
                    },
                    'photoFile' => null,
                    'photoPreview' => $student->photo_path ?? '',
                    'photoRemoved' => false,
                ];
            });

        return response()->json(['students' => $students]);
    }

    public function teachers(): JsonResponse
    {
        $teachers = User::query()
            ->whereHas('role', fn ($query) => $query->whereIn('slug', [Role::TEACHER, Role::TEACHER_ADMIN]))
            ->with(['staffProfile.department:id,name'])
            ->orderBy('username')
            ->get()
            ->map(fn (User $teacher) => [
                'id' => $teacher->id,
                'teacherId' => $teacher->staffProfile?->staff_no ?? 'TCH-'.str_pad((string) $teacher->id, 4, '0', STR_PAD_LEFT),
                'rfid' => '',
                'firstName' => $teacher->staffProfile?->first_name ?? $teacher->username,
                'middleName' => $teacher->staffProfile?->middle_name ?? '',
                'lastName' => $teacher->staffProfile?->last_name ?? '',
                'department' => $teacher->staffProfile?->department?->name ?? 'Unassigned',
                'email' => $teacher->email,
                'mobile' => $teacher->staffProfile?->mobile ?? '',
                'status' => $teacher->is_active ? 'Active' : 'Inactive',
                'photoFile' => null,
                'photoPreview' => $teacher->staffProfile?->photo_path ?? '',
                'photoRemoved' => false,
            ]);

        return response()->json(['teachers' => $teachers]);
    }

    private function studentPayload(Student $student): array
    {
        $student->load([
            'enrollments' => fn ($query) => $query->with([
                'gradeLevel.academicUnit:id,name',
                'section:id,name',
                'schoolYear:id,name',
            ])->latest('id'),
            'rfidAssignments' => fn ($query) => $query->whereNull('ends_at')->with('card:id,uid,status')->latest('starts_at'),
        ]);
        $enrollment = $student->enrollments->first();
        $assignment = $student->rfidAssignments->first();

        return [
            'id' => $student->id,
            'studentId' => $student->student_no,
            'rfid' => $assignment?->card?->uid ?? '',
            'firstName' => $student->first_name,
            'middleName' => $student->middle_name ?? '',
            'lastName' => $student->last_name,
            'gender' => ucfirst($student->gender ?? ''),
            'birthDate' => $student->birth_date?->format('Y-m-d') ?? '',
            'email' => $student->email ?? '',
            'mobile' => $student->mobile ?? '',
            'address' => $student->address ?? '',
            'guardianName' => $student->guardian_name ?? '',
            'relationship' => $student->guardian_relationship ?? '',
            'guardianContact' => $student->guardian_contact ?? '',
            'guardianEmail' => $student->guardian_email ?? '',
            'gradeLevel' => $enrollment?->gradeLevel?->name ?? 'Unassigned',
            'section' => $enrollment?->section?->name ?? 'Unassigned',
            'department' => $enrollment?->gradeLevel?->academicUnit?->name ?? 'Unassigned',
            'schoolYear' => $enrollment?->schoolYear?->name ?? 'Unassigned',
            'status' => match ($student->status) {
                'active' => $enrollment?->status === 'enrolled' ? 'Enrolled' : 'Unenrolled',
                default => 'Inactive',
            },
            'photoPreview' => $student->photo_path ?? '',
        ];
    }
}
