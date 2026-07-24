<?php

namespace App\Repositories;

use App\Core\BaseRepository;

class SubmissionRepository extends BaseRepository
{
    public function find(int $studentId, int $assignmentId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM submissions WHERE student_id = ? AND assignment_id = ? LIMIT 1');
        $stmt->execute([$studentId, $assignmentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function countForStudent(int $studentId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM submissions WHERE student_id = ?');
        $stmt->execute([$studentId]);
        return (int) $stmt->fetchColumn();
    }

    /** All submissions, joined with assignment/course titles, newest first — for the student activity log. */
    public function logForStudent(int $studentId, int $limit = 100): array
    {
        $stmt = $this->db->prepare(
            'SELECT s.*, a.title AS assignment_title, c.title AS course_title
             FROM submissions s
             JOIN assignments a ON a.id = s.assignment_id
             JOIN courses c ON c.id = a.course_id
             WHERE s.student_id = ?
             ORDER BY s.submitted_at DESC
             LIMIT ' . (int) $limit
        );
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    /** Upsert-by-unique-key — a resubmission overwrites the prior row (matches $wpdb->replace()). */
    public function submit(int $studentId, int $assignmentId, ?string $textAnswer, ?string $fileUrl, ?string $imageUrl): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO submissions (student_id, assignment_id, text_answer, file_url, image_url, submitted_at)
             VALUES (:student_id, :assignment_id, :text_answer, :file_url, :image_url, NOW())
             ON DUPLICATE KEY UPDATE
               text_answer = VALUES(text_answer),
               file_url = VALUES(file_url),
               image_url = VALUES(image_url),
               submitted_at = NOW()'
        );
        $stmt->execute([
            'student_id'    => $studentId,
            'assignment_id' => $assignmentId,
            'text_answer'   => $textAnswer,
            'file_url'      => $fileUrl,
            'image_url'     => $imageUrl,
        ]);
    }
}
