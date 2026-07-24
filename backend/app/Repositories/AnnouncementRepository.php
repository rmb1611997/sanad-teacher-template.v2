<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Announcement;

class AnnouncementRepository extends BaseRepository
{
    /** Teacher-facing list: ALL announcements regardless of is_published/date window (matches original). */
    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM announcements ORDER BY created_at DESC');
        return array_map(fn ($row) => new Announcement($row), $stmt->fetchAll());
    }

    /** Public/student-facing: only published AND within [start_date, end_date] "now" window. */
    public function published(): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM announcements
             WHERE is_published = 1
               AND (start_date IS NULL OR start_date <= NOW())
               AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY created_at DESC"
        );
        $stmt->execute();
        return array_map(fn ($row) => new Announcement($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Announcement
    {
        $stmt = $this->db->prepare('SELECT * FROM announcements WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Announcement($row) : null;
    }

    public function create(array $data): Announcement
    {
        $stmt = $this->db->prepare(
            'INSERT INTO announcements (title, content, link_url, is_published, start_date, end_date, created_at)
             VALUES (:title, :content, :link_url, :is_published, :start_date, :end_date, NOW())'
        );
        $stmt->execute([
            'title'        => $data['title'] ?? '',
            'content'      => $data['content'] ?? null,
            'link_url'     => $data['linkUrl'] ?? null,
            'is_published' => array_key_exists('isPublished', $data) ? (!empty($data['isPublished']) ? 1 : 0) : 1,
            'start_date'   => $data['startDate'] ?? null,
            'end_date'     => $data['endDate'] ?? null,
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $map = [
            'title'       => 'title',
            'content'     => 'content',
            'linkUrl'     => 'link_url',
            'isPublished' => 'is_published',
            'startDate'   => 'start_date',
            'endDate'     => 'end_date',
        ];

        $set = [];
        $params = ['id' => $id];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $value = $data[$inputKey];
            if ($inputKey === 'isPublished') {
                $value = !empty($value) ? 1 : 0;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }

        if (!$set) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE announcements SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM announcements WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
