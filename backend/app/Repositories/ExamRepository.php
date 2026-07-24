<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Exam;
use App\Services\ContentOrderService;

class ExamRepository extends BaseRepository
{
    /** @return Exam[] */
    public function all(?int $courseId = null): array
    {
        if ($courseId) {
            $stmt = $this->db->prepare('SELECT * FROM exams WHERE course_id = ? ORDER BY menu_order ASC');
            $stmt->execute([$courseId]);
        } else {
            $stmt = $this->db->query('SELECT * FROM exams ORDER BY menu_order ASC');
        }
        return array_map(fn ($row) => new Exam($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Exam
    {
        $stmt = $this->db->prepare('SELECT * FROM exams WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Exam($row) : null;
    }

    public function create(array $data): Exam
    {
        $groupId = isset($data['groupId']) && $data['groupId'] !== '' ? (int) $data['groupId'] : null;

        $stmt = $this->db->prepare(
            'INSERT INTO exams (course_id, group_id, question_group_id, title, duration, max_attempts, passing_score, total_score, shuffle_questions, show_result, is_gate, has_schedule, show_from, hide_to, menu_order, created_at)
             VALUES (:course_id, :group_id, :question_group_id, :title, :duration, :max_attempts, :passing_score, :total_score, :shuffle_questions, :show_result, :is_gate, :has_schedule, :show_from, :hide_to, :menu_order, NOW())'
        );
        $stmt->execute([
            'course_id'         => (int) $data['courseId'],
            'group_id'          => $groupId,
            'question_group_id' => isset($data['questionGroupId']) && $data['questionGroupId'] !== '' ? (int) $data['questionGroupId'] : null,
            'title'             => $data['title'] ?? '',
            'duration'          => (int) ($data['duration'] ?? 30),
            'max_attempts'      => (int) ($data['maxAttempts'] ?? 1),
            'passing_score'     => (int) ($data['passingScore'] ?? 50),
            'total_score'       => (int) ($data['totalScore'] ?? 100),
            'shuffle_questions' => !empty($data['shuffleQuestions']) ? 1 : 0,
            'show_result'       => array_key_exists('showResult', $data) ? (!empty($data['showResult']) ? 1 : 0) : 1,
            'is_gate'           => !empty($data['isGate']) ? 1 : 0,
            'has_schedule'      => !empty($data['hasSchedule']) ? 1 : 0,
            'show_from'         => $data['showFrom'] ?? null,
            'hide_to'           => $data['hideTo'] ?? null,
            'menu_order'        => ContentOrderService::nextOrder($groupId),
        ]);
        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $map = [
            'title'            => 'title',
            'courseId'         => 'course_id',
            'groupId'          => 'group_id',
            'questionGroupId'  => 'question_group_id',
            'duration'         => 'duration',
            'maxAttempts'      => 'max_attempts',
            'passingScore'     => 'passing_score',
            'totalScore'       => 'total_score',
            'shuffleQuestions' => 'shuffle_questions',
            'showResult'       => 'show_result',
            'isGate'           => 'is_gate',
            'hasSchedule'      => 'has_schedule',
            'showFrom'         => 'show_from',
            'hideTo'           => 'hide_to',
        ];

        $set = [];
        $params = ['id' => $id];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $value = $data[$inputKey];
            if (in_array($inputKey, ['shuffleQuestions', 'showResult', 'isGate', 'hasSchedule'], true)) {
                $value = !empty($value) ? 1 : 0;
            } elseif (in_array($inputKey, ['courseId', 'duration', 'maxAttempts', 'passingScore', 'totalScore'], true)) {
                $value = (int) $value;
            } elseif (in_array($inputKey, ['groupId', 'questionGroupId'], true)) {
                $value = $value !== null && $value !== '' ? (int) $value : null;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }

        if (!$set) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE exams SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM exams WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    /** Phase 7: used by the mixed-type /teacher/content/reorder endpoint. */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM exams WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return (bool) $stmt->fetchColumn();
    }

    public function setMenuOrder(int $id, int $order): void
    {
        $stmt = $this->db->prepare('UPDATE exams SET menu_order = ? WHERE id = ?');
        $stmt->execute([$order, $id]);
    }
}
