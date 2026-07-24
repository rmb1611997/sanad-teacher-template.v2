<?php

namespace App\Services;

use App\Repositories\EnrollmentRepository;
use App\Repositories\VideoProgressRepository;
use App\Repositories\VideoRepository;

/**
 * Port of sanad_get_student_course_progress(): for each of the student's
 * enrolled (non-banned) courses, a video-only completion percent.
 * percent = round(completedCount/videosTotal*100), 0 if the course has no videos.
 */
class StudentCourseProgressService
{
    public function build(int $studentId): array
    {
        $enrollments = new EnrollmentRepository();
        $videos = new VideoRepository();
        $progress = new VideoProgressRepository();

        $result = [];
        foreach ($enrollments->courseIdsForStudent($studentId) as $courseId) {
            $videoIds = array_map(fn ($v) => $v->id(), $videos->all($courseId));
            $total = count($videoIds);

            if ($total === 0) {
                $result[] = ['courseId' => $courseId, 'percent' => 0];
                continue;
            }

            $rows = $progress->forStudentAndVideos($studentId, $videoIds);
            $completed = count(array_filter($rows, fn ($r) => (int) $r['is_completed'] === 1));

            $result[] = ['courseId' => $courseId, 'percent' => (int) round(($completed / $total) * 100)];
        }

        return $result;
    }
}
