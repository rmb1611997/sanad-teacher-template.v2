<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Note;
use App\Services\ContentOrderService;

class NoteRepository extends BaseRepository
{
    /** @return Note[] */
    public function all(?int $courseId = null, ?int $groupId = null): array
    {
        $sql = 'SELECT * FROM notes WHERE 1=1';
        $params = [];
        if ($courseId) {
            $sql .= ' AND course_id = ?';
            $params[] = $courseId;
        }
        if ($groupId) {
            $sql .= ' AND group_id = ?';
            $params[] = $groupId;
        }
        $sql .= ' ORDER BY menu_order ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return array_map(fn ($row) => new Note($row), $stmt->fetchAll());
    }

    /** @return Note[] */
    public function forGroupOrderedByMenu(int $groupId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM notes WHERE group_id = ? ORDER BY menu_order ASC');
        $stmt->execute([$groupId]);
        return array_map(fn ($row) => new Note($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Note
    {
        $stmt = $this->db->prepare('SELECT * FROM notes WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Note($row) : null;
    }

    public function create(array $data): Note
    {
        $groupId = isset($data['groupId']) && $data['groupId'] !== '' ? (int) $data['groupId'] : null;

        $stmt = $this->db->prepare(
            'INSERT INTO notes (course_id, group_id, title, description, file_url, has_schedule, show_from, hide_to, menu_order, created_at)
             VALUES (:course_id, :group_id, :title, :description, :file_url, :has_schedule, :show_from, :hide_to, :menu_order, NOW())'
        );
        $stmt->execute([
            'course_id'    => (int) $data['courseId'],
            'group_id'     => $groupId,
            'title'        => $data['title'] ?? '',
            'description'  => $data['description'] ?? null,
            'file_url'     => $data['fileUrl'] ?? null,
            'has_schedule' => !empty($data['hasSchedule']) ? 1 : 0,
            'show_from'    => $data['showFrom'] ?? null,
            'hide_to'      => $data['hideTo'] ?? null,
            'menu_order'   => ContentOrderService::nextOrder($groupId),
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $map = [
            'title'       => 'title',
            'description' => 'description',
            'fileUrl'     => 'file_url',
            'hasSchedule' => 'has_schedule',
            'showFrom'    => 'show_from',
            'hideTo'      => 'hide_to',
            'courseId'    => 'course_id',
            'groupId'     => 'group_id',
        ];

        $set = [];
        $params = ['id' => $id];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $value = $data[$inputKey];
            if ($inputKey === 'hasSchedule') {
                $value = !empty($value) ? 1 : 0;
            } elseif ($inputKey === 'courseId') {
                $value = (int) $value;
            } elseif ($inputKey === 'groupId') {
                $value = $value !== null && $value !== '' ? (int) $value : null;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }

        if (!$set) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE notes SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM notes WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
