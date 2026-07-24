<?php

namespace App\Services;

use App\Repositories\CourseRepository;
use App\Repositories\EnrollmentRepository;
use App\Repositories\UserRepository;

/**
 * Port of sanad_teacher_get_overview_stats(). Real quirks replicated
 * exactly (verified against live WordPress ground truth):
 * - studentsPerCourse counts ALL enrollments (is_banned NOT filtered).
 * - a course_id with no matching course row is silently dropped from the
 *   group (this can't actually happen in backend-v2 since enrollments.course_id
 *   is a real FK — the original could get here via a stale/orphan post
 *   reference, which our schema prevents by construction; the drop-logic is
 *   kept anyway for defensive parity).
 * - studentsPerGrade/governorateData are ACROSS ALL USERS with that field
 *   set, not filtered to role=student (matches the original's raw usermeta
 *   query, which has no role filter either).
 * - topCourses = top 5 by student count, PHP-stable-sort tie order preserved.
 * - subscriptionsOverTime uses DB NOW() (not app/request time), last 30 days.
 */
class OverviewStatsService
{
    public function build(): array
    {
        $enrollments = new EnrollmentRepository();
        $courses = new CourseRepository();
        $users = new UserRepository();

        $studentsPerCourse = [];
        foreach ($enrollments->countsByCourse() as $row) {
            $course = $courses->find((int) $row['course_id']);
            if (!$course) {
                continue; // orphan course_id — silently dropped, matches original
            }
            $studentsPerCourse[] = ['name' => $course->get('title'), 'students' => (int) $row['count']];
        }

        $topCourses = $studentsPerCourse;
        usort($topCourses, fn ($a, $b) => $b['students'] - $a['students']);
        $topCourses = array_slice($topCourses, 0, 5);

        $subscriptionsOverTime = array_map(
            fn ($row) => ['date' => $row['date'], 'count' => (int) $row['count']],
            $enrollments->countsByDayLast30Days()
        );

        return [
            'studentsPerCourse'     => $studentsPerCourse,
            'studentsPerGrade'      => array_map(fn ($r) => ['name' => $r['name'], 'students' => (int) $r['students']], $users->countsByGrade()),
            'governorateData'       => array_map(fn ($r) => ['name' => $r['name'], 'value' => (int) $r['value']], $users->countsByGovernorate()),
            'topCourses'            => array_values($topCourses),
            'subscriptionsOverTime' => $subscriptionsOverTime,
        ];
    }
}
