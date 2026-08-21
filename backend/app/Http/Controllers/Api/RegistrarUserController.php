<?php

namespace App\Http\Controllers\Api;

class RegistrarUserController extends RoleUserController
{
    protected function managedRole(): string
    {
        return 'registrar';
    }

    protected function codePrefix(): string
    {
        return 'REG';
    }

    protected function accountLabel(): string
    {
        return 'Registrar';
    }
}
