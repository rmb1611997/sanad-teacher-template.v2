<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Middleware\Auth;
use App\Repositories\ExamAttemptRepository;
use App\Repositories\SubmissionRepository;
use App\Repositories\VideoProgressRepository;

/** Port of sanad_get_student_stats() / sanad_get_student_activity_log(). */
class StudentStatsController extends BaseController
{
    // GET /student/stats
    public function stats(Request $request): void
    {
        $user = Auth::requireStudent($request);

        $this->json([
            'videosWatched'   => (new VideoProgressRepository())->countCompletedForStudent($user->id()),
            'examsDone'       => (new ExamAttemptRepository())->countDistinctExamsForStudent($user->id()),
            'assignmentsDone' => (new SubmissionRepository())->countForStudent($user->id()),
        ]);
    }

    // GET /student/activity-log
    public function activityLog(Request $request): void
    {
        $user = Auth::requireStudent($request);

        $videoLogs = array_map(fn ($row) => [
            'id'          => (int) $row['id'],
            'videoTitle'  => $row['video_title'],
            'courseTitle' => $row['course_title'],
            'watchedAt'   => $row['last_watched'],
        ], (new VideoProgressRepository())->completedLogForStudent($user->id()));

        $examLogs = array_map(fn ($row) => [
            'id'          => (int) $row['id'],
            'examTitle'   => $row['exam_title'],
            'courseTitle' => $row['course_title'],
            'score'       => (int) $row['score'],
            'total'       => (int) $row['total_questions'],
            'submittedAt' => $row['submitted_at'],
        ], (new ExamAttemptRepository())->logForStudent($user->id()));

        $assignmentLogs = array_map(fn ($row) => [
            'id'               => (int) $row['id'],
            'assignmentTitle'  => $row['assignment_title'],
            'courseTitle'      => $row['course_title'],
            'grade'            => null, // dead column in the original too — never written by any endpoint
            'submittedAt'      => $row['submitted_at'],
        ], (new SubmissionRepository())->logForStudent($user->id()));

        $this->json([
            'videoLogs'      => $videoLogs,
            'examLogs'       => $examLogs,
            'assignmentLogs' => $assignmentLogs,
        ]);
    }
}
