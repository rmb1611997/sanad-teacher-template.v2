<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use App\Repositories\EnrollmentRepository;

/**
 * Port of sanad_student_can_access_course(): owner teacher always passes;
 * a free course is accessible to anyone; otherwise the student needs a
 * non-banned enrollment row.
 *
 * Phase 5 note: this now queries the real `enrollments` table added in
 * Phase 5 (see migration 0016) to complete the "no enrollment table yet"
 * TODO documented here since Phase 4 — this is the same conservative
 * fallback (false when the student has no enrollment row) that was already
 * in place and already tested, just backed by real data instead of a
 * hardcoded constant. Every Phase 3/4 test scenario that expected `false`
 * (no enrollment table) still gets `false` here (no enrollment row exists
 * for that student/course), so this does not change any previously-tested
 * outcome — it only adds the previously-impossible "actually enrolled"
 * path.
 */
class CourseAccessService
{
    public static function canAccess(Course $course, ?User $user): bool
    {
        if ($user && $user->isOwnerTeacher()) {
            return true;
        }
        if ($course->isFree()) {
            return true;
        }
        if (!$user) {
            return false;
        }
        return (new EnrollmentRepository())->isEnrolled($user->id(), $course->id());
    }
}
