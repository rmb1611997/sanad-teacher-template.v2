<?php

namespace App\Policies;

use App\Models\User;

/**
 * Port of the original restriction on /teacher/staff/*: permission_callback
 * was always the bare 'sanad_is_owner_teacher' function, never
 * sanad_require_permission(). Staff management is deliberately NOT gated by
 * the 'staff' permission key (that key exists in sanad_valid_permission_keys()
 * but is otherwise unused) — only the real teacher may create/edit/delete
 * staff accounts or change their permissions. This prevents a staff member
 * from ever granting themselves (or another staff account) more access.
 */
class StaffPolicy
{
    public static function canManage(User $user): bool
    {
        return OwnershipPolicy::isOwner($user);
    }
}
