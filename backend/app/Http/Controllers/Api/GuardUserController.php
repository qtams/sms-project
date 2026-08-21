<?php

namespace App\Http\Controllers\Api;

class GuardUserController extends RoleUserController
{
    protected function managedRole(): string
    {
        return 'guard';
    }

    protected function codePrefix(): string
    {
        return 'GRD';
    }

    protected function accountLabel(): string
    {
        return 'Guard';
    }
}
