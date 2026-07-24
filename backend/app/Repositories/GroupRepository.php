<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Group;

class GroupRepository extends BaseRepository
{
    /** @return Group[] */
    public function forCourse(int $courseId): array
    {
        // orderby=date ASC in the original public /courses/{id}/groups endpoint.
        $stmt = $this->db->prepare('SELECT * FROM `groups` WHERE course_id = ? ORDER BY created_at ASC');
        $stmt->execute([$courseId]);
        return array_map(fn ($row) => new Group($row), $stmt->fetchAll());
    }

    /** @return Group[] */
    public function forCourseOrderedByMenu(int $courseId): array
    {
        // orderby=menu_order ASC, used by the /content aggregate endpoint (deliberately
        // different ordering than forCourse() above — matches the original's inconsistency).
        $stmt = $this->db->prepare('SELECT * FROM `groups` WHERE course_id = ? ORDER BY menu_order ASC');
        $stmt->execute([$courseId]);
        return array_map(fn ($row) => new Group($row), $stmt->fetchAll());
    }

    /** @return Group[] */
    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM `groups` ORDER BY menu_order ASC');
        return array_map(fn ($row) => new Group($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Group
    {
        $stmt = $this->db->prepare('SELECT * FROM `groups` WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Group($row) : null;
    }

    /** Global MAX(menu_order)+1 across ALL courses — matches the original's un-scoped query. */
    public function nextMenuOrder(): int
    {
        $max = $this->db->query('SELECT MAX(menu_order) FROM `groups`')->fetchColumn();
        return $max !== null ? ((int) $max) + 1 : 0;
    }

    public function create(array $data): Group
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `groups` (course_id, title, description, has_schedule, show_from, hide_to, menu_order, created_at)
             VALUES (:course_id, :title, :description, :has_schedule, :show_from, :hide_to, :menu_order, NOW())'
        );
        $stmt->execute([
            'course_id'    => (int) $data['courseId'],
            'title'        => $data['title'],
            'description'  => $data['description'] ?? null,
            'has_schedule' => !empty($data['hasSchedule']) ? 1 : 0,
            'show_from'    => $data['showFrom'] ?? null,
            'hide_to'      => $data['hideTo'] ?? null,
            'menu_order'   => $this->nextMenuOrder(),
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $map = [
            'title'       => 'title',
            'description' => 'description',
            'courseId'    => 'course_id',
            'hasSchedule' => 'has_schedule',
            'showFrom'    => 'show_from',
            'hideTo'      => 'hide_to',
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
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }

        if (!$set) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE `groups` SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM `groups` WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function reorder(array $groupIds): void
    {
        $stmt = $this->db->prepare('UPDATE `groups` SET menu_order = ? WHERE id = ?');
        foreach (array_values($groupIds) as $index => $id) {
            $stmt->execute([$index, (int) $id]);
        }
    }
}
