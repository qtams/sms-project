<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfidAssignment extends Model
{
    protected $fillable = ['rfid_card_id', 'student_id', 'assigned_by', 'starts_at', 'ends_at', 'reason'];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(RfidCard::class, 'rfid_card_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
