<?php

namespace App\Policies;

use App\Models\User;

/**
 * SANAD is a single-tenant platform: the one real teacher account owns
 * every resource in the system implicitly (mirrors the original
 * sanad_is_owner_teacher() / "the teacher owns every course on this
 * single-tenant platform" comment in the WP plugin). Staff never own
 * anything themselves — their access is entirely permission-key based
 * (see PermissionService), never ownership-based.
 *
 * Resource-specific ownership checks (e.g. "does this video belong to a
 * course the current user can manage") are built on top of this primitive
 * once those resources exist (Phase 3+) — the primitive itself is
 * user-domain only and belongs in Phase 2.
 */
class OwnershipPolicy
{
    public static function isOwner(User $user): bool
    {
        return $user->isOwnerTeacher();
    }

    /** Owner teacher bypasses; everyone else needs the resource-specific check the caller provides. */
    public static function ownsOrElse(User $user, callable $resourceCheck): bool
    {
        return self::isOwner($user) || $resourceCheck();
    }
}
