<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Repositories\VideoProgressRepository;

/** Port of sanad_teacher_get_video_stats(): flat per-student array, no pagination envelope. */
class VideoStatsService
{
    public function build(int $videoId): array
    {
        $progress = new VideoProgressRepository();
        $students = (new UserRepository())->allStudents();

        return array_map(function ($student) use ($progress, $videoId) {
            $row = $progress->find($student->id(), $videoId);
            return [
                'studentId'     => $student->id(),
                'studentCode'   => $student->get('student_code'),
                'studentName'   => $student->get('full_name'),
                'studentPhone'  => $student->get('phone'),
                'parentPhone'   => $student->get('parent_phone'),
                'educationType' => $student->get('education_type'),
                'hasWatched'    => $row !== null,
                'watchPercent'  => $row ? (int) $row['watch_percent'] : 0,
                'watchedAt'     => $row['last_watched'] ?? null,
            ];
        }, $students);
    }
}
