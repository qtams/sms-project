<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class SectionTeacher extends Pivot
{
    protected $table = 'section_teachers';
    protected $fillable = ['section_id', 'teacher_id'];
}
