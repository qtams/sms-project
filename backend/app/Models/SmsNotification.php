<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsNotification extends Model
{
    protected $fillable = [
        'student_id', 'attendance_record_id', 'recipient', 'content',
        'provider', 'provider_reference_id', 'status', 'failure_reason',
        'provider_response', 'sent_at',
    ];

    protected function casts(): array
    {
        return ['provider_response' => 'array', 'sent_at' => 'datetime'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function attendanceRecord(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class);
    }
}
