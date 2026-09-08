<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolYear extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'start_date', 'end_date', 'is_active'];

    protected function casts(): array
    {
        return ['start_date' => 'date:Y-m-d', 'end_date' => 'date:Y-m-d', 'is_active' => 'boolean'];
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function enrollments(): HasMany { return $this->hasMany(Enrollment::class); }
}
