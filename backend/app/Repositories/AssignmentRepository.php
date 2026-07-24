<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Assignment;
use App\Services\ContentOrderService;

class AssignmentRepository extends BaseRepository
{
    /** @return Assignment[] */
    public function all(?int $courseId = null): array
    {
        if ($courseId) {
            $stmt = $this->db->prepare('SELECT * FROM assignments WHERE course_id = ? ORDER BY menu_order ASC');
            $stmt->execute([$courseId]);
        } else {
            $stmt = $this->db->query('SELECT * FROM assignments ORDER BY menu_order ASC');
        }
        return array_map(fn ($row) => new Assignment($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Assignment
    {
        $stmt = $this->db->prepare('SELECT * FROM assignments WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Assignment($row) : null;
    }

    public function create(array $data): Assignment
    {
        $groupId = isset($data['groupId']) && $data['groupId'] !== '' ? (int) $data['groupId'] : null;

        $stmt = $this->db->prepare(
            'INSERT INTO assignments (course_id, group_id, title, description, allow_text, allow_file, allow_image, has_deadline, due_date, is_gate, has_schedule, show_from, menu_order, created_at)
             VALUES (:course_id, :group_id, :title, :description, :allow_text, :allow_file, :allow_image, :has_deadline, :due_date, :is_gate, :has_schedule, :show_from, :menu_order, NOW())'
        );
        $stmt->execute([
            'course_id'    => (int) $data['courseId'],
            'group_id'     => $groupId,
            'title'        => $data['title'] ?? '',
            'description'  => $data['description'] ?? null,
            'allow_text'   => array_key_exists('allowText', $data) ? (!empty($data['allowText']) ? 1 : 0) : 1,
            'allow_file'   => !empty($data['allowFile']) ? 1 : 0,
            'allow_image'  => !empty($data['allowImage']) ? 1 : 0,
            'has_deadline' => !empty($data['hasDeadline']) ? 1 : 0,
            'due_date'     => $data['dueDate'] ?? null,
            'is_gate'      => !empty($data['isGate']) ? 1 : 0,
            'has_schedule' => !empty($data['hasSchedule']) ? 1 : 0,
            'show_from'    => $data['showFrom'] ?? null,
            'menu_order'   => ContentOrderService::nextOrder($groupId),
        ]);
        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $map = [
            'title'       => 'title',
            'description' => 'description',
            'courseId'    => 'course_id',
            'groupId'     => 'group_id',
            'allowText'   => 'allow_text',
            'allowFile'   => 'allow_file',
            'allowImage'  => 'allow_image',
            'hasDeadline' => 'has_deadline',
            'dueDate'     => 'due_date',
            'isGate'      => 'is_gate',
            'hasSchedule' => 'has_schedule',
            'showFrom'    => 'show_from',
        ];

        $set = [];
        $params = ['id' => $id];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $value = $data[$inputKey];
            if (in_array($inputKey, ['allowText', 'allowFile', 'allowImage', 'hasDeadline', 'isGate', 'hasSchedule'], true)) {
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

        $stmt = $this->db->prepare('UPDATE assignments SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM assignments WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    /** Phase 7: used by the mixed-type /teacher/content/reorder endpoint. */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM assignments WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return (bool) $stmt->fetchColumn();
    }

    public function setMenuOrder(int $id, int $order): void
    {
        $stmt = $this->db->prepare('UPDATE assignments SET menu_order = ? WHERE id = ?');
        $stmt->execute([$order, $id]);
    }
}
