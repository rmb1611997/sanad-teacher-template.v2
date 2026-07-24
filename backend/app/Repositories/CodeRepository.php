<?php

namespace App\Repositories;

use App\Core\BaseRepository;

class CodeRepository extends BaseRepository
{
    public function codeExists(string $code): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM codes WHERE code = ? LIMIT 1');
        $stmt->execute([$code]);
        return (bool) $stmt->fetchColumn();
    }

    public function create(string $code, int $courseId): int
    {
        $stmt = $this->db->prepare('INSERT INTO codes (code, course_id, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$code, $courseId]);
        return (int) $this->db->lastInsertId();
    }

    public function findByCode(string $code): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM codes WHERE code = ? LIMIT 1');
        $stmt->execute([$code]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function markUsed(int $id, int $usedBy): void
    {
        $stmt = $this->db->prepare('UPDATE codes SET is_used = 1, used_by = ?, used_at = NOW() WHERE id = ?');
        $stmt->execute([$usedBy, $id]);
    }

    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM codes ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }
}
