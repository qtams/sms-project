<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrection;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\RfidAssignment;
use App\Models\RfidScanEvent;
use App\Models\Student;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    private const TIMEZONE = 'Asia/Manila';

    private const DUPLICATE_COOLDOWN_SECONDS = 30;

    public function scan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rfid_uid' => ['required', 'string', 'max:100'],
            'device_code' => ['nullable', 'string', 'max:100'],
            'event_uuid' => ['nullable', 'uuid'],
        ]);
        $now = CarbonImmutable::now(self::TIMEZONE);
        $assignment = RfidAssignment::query()
            ->whereHas('card', fn (Builder $query) => $query->where('uid', $data['rfid_uid'])->where('status', 'active'))
            ->where('starts_at', '<=', $now)
            ->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->with(['card', 'student'])
            ->latest('starts_at')
            ->first();

        if (! $assignment) {
            $this->logEvent(null, null, $data['rfid_uid'], 'unknown_card', 'rejected', 'This RFID card is not assigned to an active student.', $now, $request, $data['event_uuid'] ?? null);

            return response()->json(['success' => false, 'message' => 'This RFID card is not registered or active.'], 404);
        }

        return $this->record($request, $assignment->student, $now, 'rfid', $assignment, $data['event_uuid'] ?? null);
    }

    public function manual(Request $request): JsonResponse
    {
        $data = $request->validate(['student_no' => ['required', 'string', 'max:40']]);
        $student = Student::query()->where('student_no', $data['student_no'])->first();
        $now = CarbonImmutable::now(self::TIMEZONE);

        if (! $student) {
            $this->logEvent(null, null, null, 'manual_lookup', 'rejected', 'Student number was not found.', $now, $request);

            return response()->json(['success' => false, 'message' => 'This student number is not registered.'], 404);
        }

        return $this->record($request, $student, $now, 'manual');
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
        ]);
        $date = $data['date'] ?? CarbonImmutable::now(self::TIMEZONE)->toDateString();

        $enrollments = Enrollment::query()
            ->where('status', 'enrolled')
            ->when($data['section_id'] ?? null, fn (Builder $query, int $sectionId) => $query->where('section_id', $sectionId))
            ->with([
                'student',
                'gradeLevel:id,name',
                'section:id,name',
                'section.teachers:id,username',
                'section.teachers.staffProfile:id,user_id,first_name,middle_name,last_name',
                'attendanceRecords' => fn ($query) => $query->whereDate('attendance_date', $date),
            ])
            ->orderBy('section_id')
            ->get();

        return response()->json([
            'date' => $date,
            'records' => $enrollments->map(function (Enrollment $enrollment) use ($date) {
                $record = $enrollment->attendanceRecords->first();

                return [
                    'attendanceId' => $record?->id,
                    'enrollmentId' => $enrollment->id,
                    'studentProfileId' => $enrollment->student->id,
                    'studentId' => $enrollment->student->student_no,
                    'firstName' => $enrollment->student->first_name,
                    'middleName' => $enrollment->student->middle_name ?? '',
                    'lastName' => $enrollment->student->last_name,
                    'gradeLevel' => $enrollment->gradeLevel->name,
                    'section' => $enrollment->section?->name ?? 'Unassigned',
                    'teacherName' => $this->teacherName($enrollment),
                    'date' => $date,
                    'timeIn' => $record?->first_in_at?->timezone(self::TIMEZONE)->format('h:i A') ?? '-',
                    'timeOut' => $record?->last_out_at?->timezone(self::TIMEZONE)->format('h:i A') ?? '-',
                    'status' => $record ? ucfirst($record->status) : 'Absent',
                ];
            })->values(),
        ]);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enrollment_id' => ['required', 'integer', 'exists:enrollments,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);
        $now = CarbonImmutable::now(self::TIMEZONE);

        $record = DB::transaction(function () use ($data, $now, $request) {
            $record = AttendanceRecord::query()->firstOrCreate(
                ['enrollment_id' => $data['enrollment_id'], 'attendance_date' => $data['date']],
                ['status' => 'absent', 'source' => 'manual', 'recorded_by' => $request->user()->id],
            );
            $oldStatus = $record->status;
            $oldFirstIn = $record->first_in_at;
            $newFirstIn = $data['status'] === 'present' ? ($record->first_in_at ?? $now) : $record->first_in_at;

            $record->update([
                'status' => $data['status'],
                'first_in_at' => $newFirstIn,
                'source' => 'manual',
                'recorded_by' => $request->user()->id,
            ]);

            AttendanceCorrection::create([
                'attendance_record_id' => $record->id,
                'performed_by' => $request->user()->id,
                'old_status' => $oldStatus,
                'new_status' => $data['status'],
                'old_first_in_at' => $oldFirstIn,
                'new_first_in_at' => $newFirstIn,
                'reason' => $data['reason'] ?? null,
                'corrected_at' => $now,
            ]);

            return $record->fresh('enrollment.student');
        });

        return response()->json(['message' => 'Attendance status updated.', 'record' => $this->recordPayload($record)]);
    }

    public function logs(Request $request): JsonResponse
    {
        $data = $request->validate(['after_id' => ['nullable', 'integer', 'min:0'], 'limit' => ['nullable', 'integer', 'min:1', 'max:200']]);
        $logs = RfidScanEvent::query()
            ->when($data['after_id'] ?? null, fn (Builder $query, int $afterId) => $query->where('id', '>', $afterId))
            ->with('student:id,student_no,first_name,middle_name,last_name,photo_path')
            ->latest('id')
            ->limit($data['limit'] ?? 100)
            ->get();

        return response()->json(['logs' => $logs]);
    }

    public function history(): JsonResponse
    {
        $records = AttendanceRecord::query()
            ->with(['enrollment.student', 'enrollment.gradeLevel:id,name', 'enrollment.section:id,name', 'enrollment.student.rfidAssignments' => fn ($query) => $query->whereNull('ends_at')->with('card:id,uid')->latest('starts_at')])
            ->latest('attendance_date')
            ->latest('id')
            ->limit(500)
            ->get()
            ->map(function (AttendanceRecord $record) {
                $student = $record->enrollment->student;
                $card = $student->rfidAssignments->first()?->card;

                return [
                    'id' => $record->id,
                    'studentId' => $student->student_no,
                    'rfid' => $card?->uid ?? '',
                    'firstName' => $student->first_name,
                    'middleName' => $student->middle_name ?? '',
                    'lastName' => $student->last_name,
                    'gradeLevel' => $record->enrollment->gradeLevel->name,
                    'section' => $record->enrollment->section?->name ?? 'Unassigned',
                    'date' => $record->attendance_date->format('Y-m-d'),
                    'timeIn' => $record->first_in_at?->timezone(self::TIMEZONE)->format('h:i A') ?? '',
                    'timeOut' => $record->last_out_at?->timezone(self::TIMEZONE)->format('h:i A') ?? '',
                    'status' => $record->last_out_at ? 'Complete' : ($record->first_in_at ? 'Time In Only' : 'No Tap'),
                ];
            });

        return response()->json(['records' => $records]);
    }

    public function studentHistory(Student $student): JsonResponse
    {
        $enrollment = $student->enrollments()
            ->with(['gradeLevel:id,name', 'section:id,name', 'section.teachers:id,username', 'section.teachers.staffProfile:id,user_id,first_name,middle_name,last_name'])
            ->latest('id')
            ->firstOrFail();
        $records = $enrollment->attendanceRecords()->latest('attendance_date')->get();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'studentId' => $student->student_no,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name ?? '',
                'lastName' => $student->last_name,
                'gradeLevel' => $enrollment->gradeLevel->name,
                'section' => $enrollment->section?->name ?? 'Unassigned',
                'teacherName' => $this->teacherName($enrollment),
            ],
            'records' => $records->map(fn (AttendanceRecord $record) => [
                'id' => $record->id,
                'enrollmentId' => $enrollment->id,
                'studentId' => $student->student_no,
                'date' => $record->attendance_date->format('Y-m-d'),
                'timeIn' => $record->first_in_at?->timezone(self::TIMEZONE)->format('h:i A') ?? '-',
                'timeOut' => $record->last_out_at?->timezone(self::TIMEZONE)->format('h:i A') ?? '-',
                'status' => ucfirst($record->status),
            ]),
        ]);
    }

    private function record(Request $request, Student $student, CarbonImmutable $now, string $source, ?RfidAssignment $assignment = null, ?string $eventUuid = null): JsonResponse
    {
        if ($student->status !== 'active') {
            $this->logEvent($student, $assignment, $assignment?->card?->uid, 'inactive_student', 'rejected', 'Student profile is not active.', $now, $request, $eventUuid);

            return response()->json(['success' => false, 'message' => 'This student profile is inactive.'], 422);
        }

        $enrollment = Enrollment::query()
            ->where('student_id', $student->id)
            ->where('status', 'enrolled')
            ->whereHas('schoolYear', fn (Builder $query) => $query->where('is_active', true))
            ->with(['gradeLevel.academicUnit', 'gradeLevel.academicProgram', 'section'])
            ->latest('id')
            ->first();

        if (! $enrollment) {
            $this->logEvent($student, $assignment, $assignment?->card?->uid, 'not_enrolled', 'rejected', 'Student has no active enrollment.', $now, $request, $eventUuid);

            return response()->json(['success' => false, 'message' => 'This student is not actively enrolled.'], 422);
        }

        $duplicate = RfidScanEvent::query()->where('student_id', $student->id)->where('result', 'success')
            ->where('scanned_at', '>=', $now->subSeconds(self::DUPLICATE_COOLDOWN_SECONDS))->exists();
        if ($duplicate) {
            $this->logEvent($student, $assignment, $assignment?->card?->uid, 'duplicate_scan', 'rejected', 'Attendance was already recorded recently.', $now, $request, $eventUuid);

            return response()->json(['success' => false, 'code' => 'duplicate_scan', 'cooldown_seconds' => self::DUPLICATE_COOLDOWN_SECONDS, 'message' => 'Attendance was already recorded. Please wait before scanning again.'], 409);
        }

        [$record, $action] = DB::transaction(function () use ($enrollment, $now, $source, $request) {
            $record = AttendanceRecord::query()->where('enrollment_id', $enrollment->id)
                ->whereDate('attendance_date', $now->toDateString())->lockForUpdate()->first();

            if (! $record) {
                $record = AttendanceRecord::create([
                    'enrollment_id' => $enrollment->id,
                    'attendance_date' => $now->toDateString(),
                    'status' => 'present',
                    'first_in_at' => $now,
                    'source' => $source,
                    'recorded_by' => $source === 'manual' ? $request->user()->id : null,
                ]);

                return [$record, 'check-in'];
            }

            if ($record->last_out_at) {
                return [$record, 'completed'];
            }

            $record->update(['last_out_at' => $now]);

            return [$record->fresh(), 'check-out'];
        });

        if ($action === 'completed') {
            $this->logEvent($student, $assignment, $assignment?->card?->uid, 'attendance_completed', 'rejected', 'Attendance is already complete for today.', $now, $request, $eventUuid, $record);

            return response()->json(['success' => false, 'message' => 'Attendance is already complete for today.'], 409);
        }

        $message = $action === 'check-in' ? 'Student checked in successfully.' : 'Student checked out successfully.';
        $this->logEvent($student, $assignment, $assignment?->card?->uid, str_replace('-', '_', $action), 'success', $message, $now, $request, $eventUuid, $record);

        $duration = $record->first_in_at && $record->last_out_at
            ? $record->first_in_at->diff($record->last_out_at)->format('%H:%I:%S')
            : null;

        return response()->json([
            'success' => true,
            'action' => $action,
            'message' => $message,
            'timestamp' => $now->format('M d, Y h:i:s A'),
            'duration' => $duration ? ['formatted' => $duration] : null,
            'student' => $this->studentPayload($student, $enrollment, $assignment),
            'attendance' => $this->recordPayload($record),
        ]);
    }

    private function logEvent(?Student $student, ?RfidAssignment $assignment, ?string $uid, string $type, string $result, string $message, CarbonImmutable $now, Request $request, ?string $uuid = null, ?AttendanceRecord $record = null): void
    {
        RfidScanEvent::create([
            'event_uuid' => $uuid ?? (string) Str::uuid(),
            'student_id' => $student?->id,
            'rfid_card_id' => $assignment?->rfid_card_id,
            'attendance_record_id' => $record?->id,
            'performed_by' => $request->user()?->id,
            'scanned_uid' => $uid,
            'event_type' => $type,
            'result' => $result,
            'message' => $message,
            'scanned_at' => $now,
            'received_at' => $now,
            'metadata' => ['ip' => $request->ip()],
        ]);
    }

    private function studentPayload(Student $student, Enrollment $enrollment, ?RfidAssignment $assignment): array
    {
        return [
            'id' => $student->id,
            'student_id' => $student->student_no,
            'first_name' => $student->first_name,
            'middle_name' => $student->middle_name ?? '',
            'last_name' => $student->last_name,
            'academic_level' => $enrollment->gradeLevel->academicUnit?->name ?? '',
            'level' => $enrollment->gradeLevel->name,
            'course' => trim($enrollment->gradeLevel->name.' - '.($enrollment->section?->name ?? 'Unassigned')),
            'email' => $student->email ?? '',
            'student_profile' => $student->photo_path ?? '',
            'status' => 'officially_enrolled',
            'rfid' => $assignment?->card?->uid ?? '',
        ];
    }

    private function recordPayload(AttendanceRecord $record): array
    {
        return [
            'id' => $record->id,
            'enrollment_id' => $record->enrollment_id,
            'attendance_date' => $record->attendance_date->format('Y-m-d'),
            'status' => $record->status,
            'first_in_at' => $record->first_in_at?->timezone(self::TIMEZONE)->toIso8601String(),
            'last_out_at' => $record->last_out_at?->timezone(self::TIMEZONE)->toIso8601String(),
        ];
    }

    private function teacherName(Enrollment $enrollment): string
    {
        $teacher = $enrollment->section?->teachers->first();
        $profile = $teacher?->staffProfile;

        return $profile
            ? collect([$profile->first_name, $profile->middle_name, $profile->last_name])->filter()->join(' ')
            : ($teacher?->username ?? 'Unassigned');
    }
}
