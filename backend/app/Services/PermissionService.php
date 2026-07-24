<?php

namespace App\Services;

use App\Core\Request;
use App\Exceptions\ForbiddenException;
use App\Middleware\Auth;
use App\Models\User;

/**
 * Direct port of the original sanad_require_permission($keys) callback:
 *   - must be logged in as teacher-area (teacher OR staff) — same as
 *     current_user_can('sanad_teacher') in the original.
 *   - the real (non-staff) teacher is always unrestricted (owner bypass).
 *   - a staff account must hold at least one of the given permission keys
 *     in its stored permissions array, or the request is rejected.
 * No new behavior, no new keys — same authorization decision every time.
 */
class PermissionService
{
    /** @param string|string[] $keys */
    public static function require(Request $request, $keys): User
    {
        $keys = (array) $keys;
        $user = Auth::requireTeacherArea($request);

        if (self::check($user, $keys)) {
            return $user;
        }

        throw new ForbiddenException('غير مصرح لك بهذا الإجراء');
    }

    /** Pure decision function (no throwing) — used by the middleware and by tests. */
    public static function check(User $user, array $keys): bool
    {
        if (!$user->isTeacherArea()) {
            return false;
        }

        if ($user->isOwnerTeacher()) {
            return true; // real teacher — unrestricted
        }

        $permissions = $user->permissions() ?? [];
        foreach ($keys as $key) {
            if (in_array($key, $permissions, true)) {
                return true;
            }
        }

        return false;
    }
}
