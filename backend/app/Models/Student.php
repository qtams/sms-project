<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['student_no', 'lrn', 'first_name', 'middle_name', 'last_name', 'suffix', 'birth_date', 'gender', 'email', 'mobile', 'address', 'photo_path', 'status'];

    protected function casts(): array
    {
        return ['birth_date' => 'date:Y-m-d'];
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function rfidAssignments(): HasMany
    {
        return $this->hasMany(RfidAssignment::class);
    }

    public function scanEvents(): HasMany
    {
        return $this->hasMany(RfidScanEvent::class);
    }
}
