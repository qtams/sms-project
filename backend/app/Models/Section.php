<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Section extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['grade_level_id', 'school_year_id', 'name', 'capacity', 'is_active'];

    protected function casts(): array
    {
        return ['capacity' => 'integer', 'is_active' => 'boolean'];
    }

    public function gradeLevel(): BelongsTo { return $this->belongsTo(GradeLevel::class); }
    public function schoolYear(): BelongsTo { return $this->belongsTo(SchoolYear::class); }
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'section_teachers', 'section_id', 'teacher_id')->withTimestamps();
    }
    public function enrollments(): HasMany { return $this->hasMany(Enrollment::class); }
}
