<?php

namespace App\Repositories;

use App\Core\BaseRepository;

class ExamAttemptRepository extends BaseRepository
{
    public function countForStudent(int $studentId, int $examId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM exam_attempts WHERE student_id = ? AND exam_id = ?');
        $stmt->execute([$studentId, $examId]);
        return (int) $stmt->fetchColumn();
    }

    public function bestScore(int $studentId, int $examId): ?int
    {
        $stmt = $this->db->prepare('SELECT MAX(score) FROM exam_attempts WHERE student_id = ? AND exam_id = ?');
        $stmt->execute([$studentId, $examId]);
        $value = $stmt->fetchColumn();
        return $value !== null ? (int) $value : null;
    }

    /** First (earliest) attempt row for a student+exam — matches sanad_teacher_get_exam_stats's ORDER BY submitted_at ASC LIMIT 1. */
    public function firstAttempt(int $studentId, int $examId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM exam_attempts WHERE student_id = ? AND exam_id = ? ORDER BY submitted_at ASC LIMIT 1'
        );
        $stmt->execute([$studentId, $examId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Port of the comprehensive report's per-student exam aggregation query:
     * grouped by (exam_id, total_questions) — NOT just exam_id — replicating
     * the original's real quirk where multiple total_questions values for
     * the same exam (e.g. exam edited between attempts) fragment into
     * separate "solved" groups.
     */
    public function bestAttemptsGroupedByExamAndTotalQuestions(int $studentId, array $examIds): array
    {
        if (!$examIds) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($examIds), '?'));
        $stmt = $this->db->prepare(
            "SELECT exam_id, MAX(score) AS best_score, total_questions, MAX(submitted_at) AS last_at
             FROM exam_attempts
             WHERE student_id = ? AND exam_id IN ($placeholders)
             GROUP BY exam_id, total_questions"
        );
        $stmt->execute(array_merge([$studentId], $examIds));
        return $stmt->fetchAll();
    }

    public function countDistinctExamsForStudent(int $studentId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(DISTINCT exam_id) FROM exam_attempts WHERE student_id = ?');
        $stmt->execute([$studentId]);
        return (int) $stmt->fetchColumn();
    }

    /** All attempts, joined with exam/course titles, newest first — for the student activity log. */
    public function logForStudent(int $studentId, int $limit = 100): array
    {
        $stmt = $this->db->prepare(
            'SELECT ea.*, e.title AS exam_title, c.title AS course_title
             FROM exam_attempts ea
             JOIN exams e ON e.id = ea.exam_id
             JOIN courses c ON c.id = e.course_id
             WHERE ea.student_id = ?
             ORDER BY ea.submitted_at DESC
             LIMIT ' . (int) $limit
        );
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    public function record(int $studentId, int $examId, int $score, int $totalQuestions, array $answers, ?string $startedAt): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO exam_attempts (student_id, exam_id, score, total_questions, answers, started_at, submitted_at)
             VALUES (:student_id, :exam_id, :score, :total_questions, :answers, :started_at, NOW())'
        );
        $stmt->execute([
            'student_id'      => $studentId,
            'exam_id'         => $examId,
            'score'           => $score,
            'total_questions' => $totalQuestions,
            'answers'         => json_encode($answers),
            'started_at'      => $startedAt,
        ]);
        return (int) $this->db->lastInsertId();
    }
}
