<?php

namespace App\Middleware;

use App\Core\Request;
use App\Models\User;
use App\Services\PermissionService;

/**
 * Route-level permission gate. Controllers call
 * Permission::require($request, 'courses') (or an array of keys) at the top
 * of a handler exactly like they call Auth::requireTeacherArea(); throws
 * ForbiddenException/UnauthorizedException on failure via PermissionService.
 */
class Permission
{
    /** @param string|string[] $keys */
    public static function require(Request $request, $keys): User
    {
        return PermissionService::require($request, $keys);
    }
}
