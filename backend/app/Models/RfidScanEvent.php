<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfidScanEvent extends Model
{
    protected $fillable = ['event_uuid', 'student_id', 'rfid_card_id', 'rfid_device_id', 'attendance_record_id', 'performed_by', 'scanned_uid', 'event_type', 'result', 'message', 'scanned_at', 'received_at', 'metadata'];

    protected function casts(): array
    {
        return ['scanned_at' => 'datetime', 'received_at' => 'datetime', 'metadata' => 'array'];
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
