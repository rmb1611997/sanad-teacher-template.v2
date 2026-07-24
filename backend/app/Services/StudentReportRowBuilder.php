<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\EnrollmentRepository;
use App\Repositories\ExamAttemptRepository;
use App\Repositories\ExamRepository;
use App\Repositories\VideoProgressRepository;
use App\Repositories\VideoRepository;

/**
 * Port of sanad_build_student_report_row($user, $only_course_id=0). Builds
 * one comprehensive-report row per student, including the internal `_level`
 * sort key (callers must strip it before returning JSON — see
 * ComprehensiveReportService, matching the original's own strip step).
 *
 * Real quirks replicated exactly (not "fixed"):
 * - avgWatchPercent averages over progress ROWS THAT EXIST (videos the
 *   student has touched), not over videosTotalCount.
 * - examsSolvedCount groups by (exam_id, total_questions) pairs, not just
 *   exam_id — a student with attempts recorded under two different
 *   total_questions values for the same exam counts as TWO solved exams.
 * - totalWatchTimeMinutes = sum(video.duration * watch_percent/100) across
 *   progress rows, rounded once at the end.
 * - _level = round(avg of 4 percents: videoCompletionPercent, avgWatchPercent,
 *   examCompletionPercent, avgExamScorePercent) — simple unweighted mean.
 */
class StudentReportRowBuilder
{
    private EnrollmentRepository $enrollments;
    private VideoRepository $videos;
    private ExamRepository $exams;
    private VideoProgressRepository $progress;
    private ExamAttemptRepository $attempts;

    public function __construct()
    {
        $this->enrollments = new EnrollmentRepository();
        $this->videos = new VideoRepository();
        $this->exams = new ExamRepository();
        $this->progress = new VideoProgressRepository();
        $this->attempts = new ExamAttemptRepository();
    }

    /** Returns null if $onlyCourseId is given and the student isn't enrolled in it (row dropped entirely). */
    public function build(User $student, int $onlyCourseId = 0): ?array
    {
        $courseIds = $this->enrollments->courseIdsForStudent($student->id());

        if ($onlyCourseId) {
            if (!in_array($onlyCourseId, $courseIds, true)) {
                return null;
            }
            $courseIds = [$onlyCourseId];
        }

        $videoIds = [];
        $examIds = [];
        foreach ($courseIds as $courseId) {
            foreach ($this->videos->all($courseId) as $video) {
                $videoIds[] = $video->id();
            }
            foreach ($this->exams->all($courseId) as $exam) {
                $examIds[] = $exam->id();
            }
        }
        $videoIds = array_values(array_unique($videoIds));
        $examIds = array_values(array_unique($examIds));

        $videosTotalCount = count($videoIds);
        $examsTotalCount = count($examIds);

        $videosWatchedCount = 0;
        $avgWatchPercent = 0;
        $totalWatchTimeMinutes = 0;
        $lastVideoAt = null;

        if ($videosTotalCount > 0) {
            $progressRows = $this->progress->forStudentAndVideos($student->id(), $videoIds);
            $watchedCount = count($progressRows);

            if ($watchedCount > 0) {
                $sumPercent = 0;
                $watchMinutes = 0.0;
                foreach ($progressRows as $row) {
                    if ((int) $row['is_completed'] === 1) {
                        $videosWatchedCount++;
                    }
                    $sumPercent += (int) $row['watch_percent'];

                    $video = $this->videos->find((int) $row['video_id']);
                    $duration = $video ? (float) ($video->get('duration') ?? 0) : 0.0;
                    $watchMinutes += $duration * ((int) $row['watch_percent'] / 100);

                    if ($row['last_watched'] && (!$lastVideoAt || strtotime($row['last_watched']) > strtotime($lastVideoAt))) {
                        $lastVideoAt = $row['last_watched'];
                    }
                }
                $avgWatchPercent = (int) round($sumPercent / $watchedCount);
                $totalWatchTimeMinutes = (int) round($watchMinutes);
            }
        }

        $examsSolvedCount = 0;
        $avgExamScorePercent = 0;
        $lastExamAt = null;

        if ($examsTotalCount > 0) {
            $attemptRows = $this->attempts->bestAttemptsGroupedByExamAndTotalQuestions($student->id(), $examIds);
            $examsSolvedCount = count($attemptRows);

            if ($examsSolvedCount > 0) {
                $percents = [];
                foreach ($attemptRows as $row) {
                    $totalQuestions = (int) $row['total_questions'];
                    $percents[] = $totalQuestions > 0 ? ((int) $row['best_score'] / $totalQuestions) * 100 : 0;

                    if ($row['last_at'] && (!$lastExamAt || strtotime($row['last_at']) > strtotime($lastExamAt))) {
                        $lastExamAt = $row['last_at'];
                    }
                }
                $avgExamScorePercent = (int) round(array_sum($percents) / count($percents));
            }
        }

        $videoCompletionPercent = $videosTotalCount > 0 ? (int) round(($videosWatchedCount / $videosTotalCount) * 100) : 0;
        $examCompletionPercent = $examsTotalCount > 0 ? (int) round(($examsSolvedCount / $examsTotalCount) * 100) : 0;

        $level = (int) round(($videoCompletionPercent + $avgWatchPercent + $examCompletionPercent + $avgExamScorePercent) / 4);

        $lastActivityAt = null;
        if ($lastVideoAt && $lastExamAt) {
            $lastActivityAt = strtotime($lastVideoAt) > strtotime($lastExamAt) ? $lastVideoAt : $lastExamAt;
        } else {
            $lastActivityAt = $lastVideoAt ?: $lastExamAt;
        }

        return [
            'id'                     => $student->id(),
            'name'                   => $student->get('full_name'),
            'phone'                  => $student->get('phone'),
            'parentPhone'            => $student->get('parent_phone'),
            'grade'                  => $student->get('grade'),
            'avatar'                 => null,
            'videosWatchedCount'     => $videosWatchedCount,
            'videosTotalCount'       => $videosTotalCount,
            'avgWatchPercent'        => $avgWatchPercent,
            'examsSolvedCount'       => $examsSolvedCount,
            'examsTotalCount'        => $examsTotalCount,
            'avgExamScorePercent'    => $avgExamScorePercent,
            'totalWatchTimeMinutes'  => $totalWatchTimeMinutes,
            'videoCompletionPercent' => $videoCompletionPercent,
            'examCompletionPercent'  => $examCompletionPercent,
            'lastActivityAt'         => $lastActivityAt,
            '_level'                 => $level,
        ];
    }
}
