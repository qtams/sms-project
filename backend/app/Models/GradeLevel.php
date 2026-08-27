<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GradeLevel extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['academic_unit_id', 'academic_program_id', 'name', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer', 'is_active' => 'boolean'];
    }

    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function academicUnit(): BelongsTo { return $this->belongsTo(AcademicUnit::class); }
    public function academicProgram(): BelongsTo { return $this->belongsTo(AcademicProgram::class); }
    public function sections(): HasMany { return $this->hasMany(Section::class); }
}
