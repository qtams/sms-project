<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\SmsNotification;
use App\Models\Student;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Throwable;

class UniSmsService
{
    public function sendCheckIn(Student $student, AttendanceRecord $record, CarbonImmutable $checkedInAt): SmsNotification
    {
        $recipient = $this->normalizePhilippineNumber($student->mobile);
        $content = sprintf(
            'SPRYtech: %s checked in on %s.',
            collect([$student->first_name, $student->middle_name, $student->last_name])->filter()->join(' '),
            $checkedInAt->format('M d, Y \a\t h:i A'),
        );

        $notification = SmsNotification::query()->updateOrCreate([
            'attendance_record_id' => $record->id,
            'provider' => 'unisms',
        ], [
            'student_id' => $student->id,
            'recipient' => $recipient ?? (string) $student->mobile,
            'content' => $content,
            'status' => 'pending',
            'failure_reason' => null,
        ]);

        if (! config('services.unisms.enabled')) {
            $notification->update(['status' => 'skipped', 'failure_reason' => 'UniSMS is disabled.']);
            return $notification;
        }

        if (! $recipient) {
            $notification->update(['status' => 'skipped', 'failure_reason' => 'Student mobile number is missing or invalid.']);
            return $notification;
        }

        $secret = (string) config('services.unisms.secret_key');
        $senderId = (string) config('services.unisms.sender_id');
        if ($secret === '' || $senderId === '') {
            $notification->update(['status' => 'failed', 'failure_reason' => 'UniSMS credentials or Sender ID are not configured.']);
            return $notification;
        }

        try {
            $request = Http::withBasicAuth($secret, '')
                ->acceptJson()
                ->timeout(10)
                ->retry(2, 250);

            $caBundle = config('services.unisms.ca_bundle');
            if (! $caBundle || ! is_file($caBundle)) {
                $laragonCaBundle = realpath(base_path('../../../etc/ssl/cacert.pem'));
                $caBundle = $laragonCaBundle && is_file($laragonCaBundle) ? $laragonCaBundle : null;
            }
            if ($caBundle) {
                $request = $request->withOptions(['verify' => $caBundle]);
            }

            $response = $request->post(rtrim((string) config('services.unisms.base_url'), '/').'/sms', [
                    'recipient' => $recipient,
                    'content' => $content,
                    'sender_id' => $senderId,
                    'metadata' => [
                        'student_id' => $student->student_no,
                        'attendance_record_id' => $record->id,
                        'event' => 'student_check_in',
                    ],
                ]);

            $payload = $response->json() ?: [];
            $message = $payload['message'] ?? [];
            $failureReason = is_array($message)
                ? ($message['fail_reason'] ?? null)
                : (is_string($message) ? $message : null);
            $notification->update([
                'provider_reference_id' => $message['reference_id'] ?? null,
                'status' => $response->successful() ? ($message['status'] ?? 'accepted') : 'failed',
                'failure_reason' => $response->successful() ? null : ($failureReason ?? 'UniSMS rejected the request.'),
                'provider_response' => $payload,
                'sent_at' => $response->successful() ? now() : null,
            ]);
        } catch (Throwable $exception) {
            report($exception);
            $notification->update(['status' => 'failed', 'failure_reason' => $exception->getMessage()]);
        }

        return $notification->fresh();
    }

    private function normalizePhilippineNumber(?string $number): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $number);
        if (preg_match('/^09\d{9}$/', $digits)) return '+63'.substr($digits, 1);
        if (preg_match('/^639\d{9}$/', $digits)) return '+'.$digits;
        if (preg_match('/^9\d{9}$/', $digits)) return '+63'.$digits;
        return null;
    }
}
