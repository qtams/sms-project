<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'staff_no', 'first_name', 'middle_name', 'last_name', 'suffix',
        'birth_date', 'gender', 'mobile', 'address', 'department_id',
        'position_id', 'photo_path', 'employment_status', 'hire_date',
    ];

    protected function casts(): array
    {
        return ['birth_date' => 'date:Y-m-d', 'hire_date' => 'date:Y-m-d'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function getFullNameAttribute(): string
    {
        return collect([$this->first_name, $this->middle_name, $this->last_name, $this->suffix])
            ->filter()->implode(' ');
    }
}
