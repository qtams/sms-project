<?php

namespace App\Http\Controllers\Api;

class AdminUserController extends RoleUserController
{
    protected function managedRole(): string
    {
        return 'admin';
    }

    protected function codePrefix(): string
    {
        return 'ADM';
    }

    protected function accountLabel(): string
    {
        return 'Administrator';
    }
}
