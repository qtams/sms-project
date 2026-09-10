<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_view_and_update_real_student_details(): void
    {
        $this->actingAs(User::factory()->create());
        Student::query()->create([
            'student_no' => '20260000001',
            'first_name' => 'Juan',
            'middle_name' => 'Dela',
            'last_name' => 'Cruz',
            'gender' => 'male',
            'status' => 'active',
            'mobile' => '09123456789',
        ]);

        $this->getJson('/api/students/20260000001')
            ->assertOk()
            ->assertJsonPath('student.studentId', '20260000001');

        $this->patchJson('/api/students/20260000001', [
            'firstName' => 'Juan',
            'middleName' => 'Dela',
            'lastName' => 'Cruz',
            'birthDate' => '2013-05-10',
            'gender' => 'Male',
            'status' => 'Enrolled',
            'email' => 'juan.cruz@example.test',
            'mobile' => '09274158625',
            'address' => 'Cagayan de Oro City',
            'guardianName' => 'Maria Dela Cruz',
            'relationship' => 'Mother',
            'guardianContact' => '09123456789',
            'guardianEmail' => 'maria.delacruz@example.test',
        ])->assertOk()->assertJsonPath('student.mobile', '09274158625');

        $this->assertDatabaseHas('students', [
            'student_no' => '20260000001',
            'mobile' => '09274158625',
            'guardian_name' => 'Maria Dela Cruz',
        ]);
    }
}
