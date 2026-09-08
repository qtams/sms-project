<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug'])]
class Role extends Model
{
    public const ADMIN = 'admin';

    public const REGISTRAR = 'registrar';

    public const GUARD = 'guard';

    public const TEACHER_ADMIN = 'teacher_admin';

    public const TEACHER = 'teacher';

    public const STUDENT = 'student';

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public static function idFor(string $slug): int
    {
        return (int) static::query()->where('slug', $slug)->valueOrFail('id');
    }
}
