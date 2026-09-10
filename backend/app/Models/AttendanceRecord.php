<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceRecord extends Model
{
    protected $fillable = ['enrollment_id', 'attendance_date', 'status', 'first_in_at', 'last_out_at', 'source', 'recorded_by'];

    protected function casts(): array
    {
        return ['attendance_date' => 'date:Y-m-d', 'first_in_at' => 'datetime', 'last_out_at' => 'datetime'];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function scanEvents(): HasMany
    {
        return $this->hasMany(RfidScanEvent::class);
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(AttendanceCorrection::class);
    }

    public function smsNotifications(): HasMany
    {
        return $this->hasMany(SmsNotification::class);
    }
}
