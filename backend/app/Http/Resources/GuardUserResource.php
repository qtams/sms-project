<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GuardUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $nameParts = preg_split('/\s+/', trim($this->name), 2);

        $firstName = $this->first_name ?: ($nameParts[0] ?? '');
        $lastName = $this->last_name ?: ($nameParts[1] ?? '');

        return [
            'id' => $this->id,
            'userId' => $this->user_code,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'fullName' => trim("{$firstName} {$lastName}"),
            'username' => $this->username,
            'email' => $this->email,
            'mobile' => $this->mobile,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'department' => $this->department,
            'position' => $this->position,
            'rfid' => $this->rfid,
            'role' => $this->role,
            'status' => $this->is_active ? 'Active' : 'Inactive',
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
