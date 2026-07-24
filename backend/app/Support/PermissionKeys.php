<?php

namespace App\Support;

/**
 * The exact permission-key catalog from the original WordPress plugin's
 * sanad_valid_permission_keys(). Any permissions array stored on a staff
 * user is filtered against this list — same behavior as the original
 * array_intersect() calls in sanad_teacher_create_staff()/update_staff().
 * DO NOT add or remove keys here; this is a 1:1 migration, not a redesign.
 */
class PermissionKeys
{
    public const ALL = [
        'course-content', 'courses', 'groups', 'categories', 'videos', 'notes', 'links',
        'exams', 'assignments', 'question-groups', 'question-bank',
        'codes', 'code-details', 'subscription-control',
        'reports', 'exam-stats', 'video-stats', 'comprehensive-reports',
        'students', 'student-code-details', 'edit-student', 'subscriptions', 'staff',
        'announcements',
    ];

    /** Filters an arbitrary input array down to only valid, deduped keys, reindexed. */
    public static function sanitize(array $keys): array
    {
        return array_values(array_intersect(array_unique($keys), self::ALL));
    }
}
