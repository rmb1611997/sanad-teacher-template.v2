<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Video;
use App\Services\ContentOrderService;

class VideoRepository extends BaseRepository
{
    /** @return Video[] */
    public function all(?int $courseId = null, ?int $groupId = null): array
    {
        $sql = 'SELECT * FROM videos WHERE 1=1';
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
        return array_map(fn ($row) => new Video($row), $stmt->fetchAll());
    }

    /** @return Video[] */
    public function forGroupOrderedByMenu(int $groupId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM videos WHERE group_id = ? ORDER BY menu_order ASC');
        $stmt->execute([$groupId]);
        return array_map(fn ($row) => new Video($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Video
    {
        $stmt = $this->db->prepare('SELECT * FROM videos WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Video($row) : null;
    }

    public function create(array $data): Video
    {
        $groupId = isset($data['groupId']) && $data['groupId'] !== '' ? (int) $data['groupId'] : null;

        $stmt = $this->db->prepare(
            'INSERT INTO videos (course_id, group_id, title, description, url, provider, duration, thumbnail, is_free, is_gate, has_schedule, show_from, hide_to, menu_order, created_at)
             VALUES (:course_id, :group_id, :title, :description, :url, :provider, :duration, :thumbnail, :is_free, :is_gate, :has_schedule, :show_from, :hide_to, :menu_order, NOW())'
        );
        $stmt->execute([
            'course_id'    => (int) $data['courseId'],
            'group_id'     => $groupId,
            'title'        => $data['title'],
            'description'  => $data['description'] ?? null,
            'url'          => $data['url'] ?? null,
            'provider'     => $data['provider'] ?? 'YouTube',
            'duration'     => isset($data['duration']) ? (int) $data['duration'] : null,
            'thumbnail'    => $data['thumbnail'] ?? null,
            'is_free'      => !empty($data['isFree']) ? 1 : 0,
            'is_gate'      => !empty($data['isGate']) ? 1 : 0,
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
            'url'         => 'url',
            'provider'    => 'provider',
            'duration'    => 'duration',
            'thumbnail'   => 'thumbnail',
            'isFree'      => 'is_free',
            'isGate'      => 'is_gate',
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
            if (in_array($inputKey, ['isFree', 'isGate', 'hasSchedule'], true)) {
                $value = !empty($value) ? 1 : 0;
            } elseif (in_array($inputKey, ['courseId', 'duration'], true) && $value !== null) {
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

        $stmt = $this->db->prepare('UPDATE videos SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM videos WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function reorder(array $videoIds): void
    {
        $stmt = $this->db->prepare('UPDATE videos SET menu_order = ? WHERE id = ?');
        foreach (array_values($videoIds) as $index => $id) {
            $stmt->execute([$index, (int) $id]);
        }
    }

    /** Phase 7: used by the mixed-type /teacher/content/reorder endpoint. */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM videos WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return (bool) $stmt->fetchColumn();
    }

    public function setMenuOrder(int $id, int $order): void
    {
        $stmt = $this->db->prepare('UPDATE videos SET menu_order = ? WHERE id = ?');
        $stmt->execute([$order, $id]);
    }
}
