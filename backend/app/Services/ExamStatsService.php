<?php

namespace App\Services;

use App\Repositories\ExamAttemptRepository;
use App\Repositories\ExamRepository;
use App\Repositories\UserRepository;

/**
 * Port of sanad_teacher_get_exam_stats(): flat per-student array, takes the
 * FIRST (earliest submitted) attempt per student — not best/latest.
 * durationSeconds is null unless both started_at and submitted_at are
 * present and the difference is non-negative (matches original guard).
 */
class ExamStatsService
{
    public function build(int $examId): array
    {
        $exam = (new ExamRepository())->find($examId);
        $totalScore = $exam ? $exam->totalScore() : 0;

        $attempts = new ExamAttemptRepository();
        $students = (new UserRepository())->allStudents();

        return array_map(function ($student) use ($attempts, $examId, $totalScore) {
            $row = $attempts->firstAttempt($student->id(), $examId);

            $durationSeconds = null;
            if ($row && !empty($row['started_at']) && !empty($row['submitted_at'])) {
                $diff = strtotime($row['submitted_at']) - strtotime($row['started_at']);
                $durationSeconds = $diff >= 0 ? $diff : null;
            }

            return [
                'studentId'      => $student->id(),
                'studentCode'    => $student->get('student_code'),
                'studentName'    => $student->get('full_name'),
                'studentPhone'   => $student->get('phone'),
                'parentPhone'    => $student->get('parent_phone'),
                'educationType'  => $student->get('education_type'),
                'hasSubmitted'   => $row !== null,
                'score'          => $row ? (int) $row['score'] : 0,
                'totalScore'     => $totalScore,
                'totalQuestions' => $row ? (int) $row['total_questions'] : 0,
                'startedAt'      => $row['started_at'] ?? null,
                'submittedAt'    => $row['submitted_at'] ?? null,
                'durationSeconds' => $durationSeconds,
            ];
        }, $students);
    }
}
