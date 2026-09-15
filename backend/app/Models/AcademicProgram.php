<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicProgram extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['academic_unit_id', 'parent_id', 'code', 'name', 'program_type', 'description', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function academicUnit(): BelongsTo { return $this->belongsTo(AcademicUnit::class); }
    public function parent(): BelongsTo { return $this->belongsTo(self::class, 'parent_id'); }
    public function children(): HasMany { return $this->hasMany(self::class, 'parent_id'); }
    public function gradeLevels(): HasMany { return $this->hasMany(GradeLevel::class); }
}
