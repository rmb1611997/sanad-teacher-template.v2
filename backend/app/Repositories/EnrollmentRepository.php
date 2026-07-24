<?php

namespace App\Repositories;

use App\Core\BaseRepository;

class EnrollmentRepository extends BaseRepository
{
    public function isEnrolled(int $studentId, int $courseId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? AND is_banned = 0 LIMIT 1'
        );
        $stmt->execute([$studentId, $courseId]);
        return (bool) $stmt->fetchColumn();
    }

    /** @return int[] course_ids the student is actively (non-banned) enrolled in */
    public function courseIdsForStudent(int $studentId): array
    {
        $stmt = $this->db->prepare('SELECT course_id FROM enrollments WHERE student_id = ? AND is_banned = 0');
        $stmt->execute([$studentId]);
        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    /** Port of studentsPerCourse: counts ALL enrollments per course_id, is_banned NOT filtered (matches original). */
    public function countsByCourse(): array
    {
        $stmt = $this->db->query('SELECT course_id, COUNT(*) AS count FROM enrollments GROUP BY course_id');
        return $stmt->fetchAll();
    }

    /** Port of subscriptionsOverTime: last 30 days, grouped by DATE(enrolled_at), using DB NOW() like the original. */
    public function countsByDayLast30Days(): array
    {
        $stmt = $this->db->query(
            "SELECT DATE(enrolled_at) AS date, COUNT(*) AS count
             FROM enrollments
             WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(enrolled_at)
             ORDER BY date ASC"
        );
        return $stmt->fetchAll();
    }

    public function create(int $studentId, int $courseId, ?int $codeId = null): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO enrollments (student_id, course_id, code_id, is_banned, enrolled_at) VALUES (?, ?, ?, 0, NOW())'
        );
        $stmt->execute([$studentId, $courseId, $codeId]);
        return (int) $this->db->lastInsertId();
    }

    /** Any enrollment row exists (banned or not) — matches activate-code's original ban-unfiltered duplicate check. */
    public function existsForStudentCourse(int $studentId, int $courseId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1');
        $stmt->execute([$studentId, $courseId]);
        return (bool) $stmt->fetchColumn();
    }

    public function deleteForStudentCourse(int $studentId, int $courseId): void
    {
        $stmt = $this->db->prepare('DELETE FROM enrollments WHERE student_id = ? AND course_id = ?');
        $stmt->execute([$studentId, $courseId]);
    }

    public function setBanned(int $studentId, int $courseId, bool $banned): void
    {
        $stmt = $this->db->prepare('UPDATE enrollments SET is_banned = ? WHERE student_id = ? AND course_id = ?');
        $stmt->execute([$banned ? 1 : 0, $studentId, $courseId]);
    }

    public function countForStudent(int $studentId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM enrollments WHERE student_id = ?');
        $stmt->execute([$studentId]);
        return (int) $stmt->fetchColumn();
    }

    /** All course_ids a student has ever been enrolled in (banned or not) — for teacher-facing student profile. */
    public function allCourseIdsForStudent(int $studentId): array
    {
        $stmt = $this->db->prepare('SELECT course_id FROM enrollments WHERE student_id = ?');
        $stmt->execute([$studentId]);
        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    /** All enrollments joined with student display data, for the teacher subscriptions list. */
    public function allWithStudents(): array
    {
        $stmt = $this->db->query(
            "SELECT e.*, u.full_name, u.phone, u.parent_phone, u.governorate, u.education_type, u.grade, u.student_code
             FROM enrollments e
             JOIN users u ON u.id = e.student_id
             ORDER BY e.enrolled_at DESC"
        );
        return $stmt->fetchAll();
    }
}
