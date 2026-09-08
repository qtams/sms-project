<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceCorrection extends Model
{
    protected $fillable = ['attendance_record_id', 'performed_by', 'old_status', 'new_status', 'old_first_in_at', 'new_first_in_at', 'reason', 'corrected_at'];

    protected function casts(): array
    {
        return ['old_first_in_at' => 'datetime', 'new_first_in_at' => 'datetime', 'corrected_at' => 'datetime'];
    }

    public function attendanceRecord(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class);
    }
}
