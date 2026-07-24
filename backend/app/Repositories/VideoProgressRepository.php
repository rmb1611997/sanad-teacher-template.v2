<?php

namespace App\Repositories;

use App\Core\BaseRepository;

class VideoProgressRepository extends BaseRepository
{
    public function find(int $studentId, int $videoId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM video_progress WHERE student_id = ? AND video_id = ? LIMIT 1');
        $stmt->execute([$studentId, $videoId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Phase 5: all progress rows for a student across a given set of video ids (for report row building). */
    public function forStudentAndVideos(int $studentId, array $videoIds): array
    {
        if (!$videoIds) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($videoIds), '?'));
        $stmt = $this->db->prepare(
            "SELECT * FROM video_progress WHERE student_id = ? AND video_id IN ($placeholders)"
        );
        $stmt->execute(array_merge([$studentId], $videoIds));
        return $stmt->fetchAll();
    }

    public function countCompletedForStudent(int $studentId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM video_progress WHERE student_id = ? AND is_completed = 1');
        $stmt->execute([$studentId]);
        return (int) $stmt->fetchColumn();
    }

    /** Completed videos, joined with video/course titles, newest first — for the student activity log. */
    public function completedLogForStudent(int $studentId, int $limit = 100): array
    {
        $stmt = $this->db->prepare(
            'SELECT vp.*, v.title AS video_title, c.title AS course_title
             FROM video_progress vp
             JOIN videos v ON v.id = vp.video_id
             JOIN courses c ON c.id = v.course_id
             WHERE vp.student_id = ? AND vp.is_completed = 1
             ORDER BY vp.last_watched DESC
             LIMIT ' . (int) $limit
        );
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    /**
     * Unconditional overwrite upsert — NO "furthest progress wins" logic,
     * matches the original's $wpdb->replace(): a lower percent submitted
     * later genuinely regresses watch_percent and can un-complete the video.
     */
    public function upsert(int $studentId, int $videoId, int $watchPercent, bool $isCompleted): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO video_progress (student_id, video_id, watch_percent, is_completed, last_watched)
             VALUES (:student_id, :video_id, :watch_percent, :is_completed, NOW())
             ON DUPLICATE KEY UPDATE
               watch_percent = VALUES(watch_percent),
               is_completed = VALUES(is_completed),
               last_watched = NOW()'
        );
        $stmt->execute([
            'student_id'    => $studentId,
            'video_id'      => $videoId,
            'watch_percent' => $watchPercent,
            'is_completed'  => $isCompleted ? 1 : 0,
        ]);
    }
}
