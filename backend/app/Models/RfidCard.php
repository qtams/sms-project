<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RfidCard extends Model
{
    protected $fillable = ['uid', 'status', 'issued_at'];

    protected function casts(): array
    {
        return ['issued_at' => 'datetime'];
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(RfidAssignment::class);
    }
}
