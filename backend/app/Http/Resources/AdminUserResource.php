<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->staffProfile;
        $firstName = $profile?->first_name ?? '';
        $lastName = $profile?->last_name ?? '';

        return [
            'id' => $this->id,
            'userId' => $profile?->staff_no,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'fullName' => trim("{$firstName} {$lastName}"),
            'username' => $this->username,
            'email' => $this->email,
            'middleName' => $profile?->middle_name,
            'suffix' => $profile?->suffix,
            'mobile' => $profile?->mobile,
            'birthday' => $profile?->birth_date?->format('Y-m-d'),
            'address' => $profile?->address,
            'departmentId' => $profile?->department_id,
            'department' => $profile?->department?->name,
            'positionId' => $profile?->position_id,
            'position' => $profile?->position?->name,
            'employmentStatus' => $profile?->employment_status,
            'hireDate' => $profile?->hire_date?->format('Y-m-d'),
            'rfid' => null,
            'role' => $this->role->slug,
            'status' => $this->is_active ? 'Active' : 'Inactive',
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
