<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DirectoryController extends Controller
{
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
}
