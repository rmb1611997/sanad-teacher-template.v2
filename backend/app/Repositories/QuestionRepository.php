<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Question;

class QuestionRepository extends BaseRepository
{
    /** @return Question[] */
    public function all(?int $groupId = null): array
    {
        if ($groupId) {
            $stmt = $this->db->prepare('SELECT * FROM questions WHERE question_group_id = ? ORDER BY created_at ASC');
            $stmt->execute([$groupId]);
        } else {
            $stmt = $this->db->query('SELECT * FROM questions ORDER BY created_at ASC');
        }
        return array_map(fn ($row) => new Question($row), $stmt->fetchAll());
    }

    /** @return Question[] */
    public function forQuestionGroup(int $groupId): array
    {
        return $this->all($groupId);
    }

    public function find(int $id): ?Question
    {
        $stmt = $this->db->prepare('SELECT * FROM questions WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Question($row) : null;
    }

    public function create(array $data): Question
    {
        $choices = array_values((array) ($data['choices'] ?? ['', '', '', '']));
        $choices = array_map(fn ($c) => (string) $c, $choices);

        $stmt = $this->db->prepare(
            'INSERT INTO questions (question_group_id, text, type, image, choices, correct_answer, label_style, created_at)
             VALUES (:question_group_id, :text, :type, :image, :choices, :correct_answer, :label_style, NOW())'
        );
        $stmt->execute([
            'question_group_id' => (int) $data['questionGroupId'],
            'text'              => $data['text'] ?? '',
            'type'              => $data['type'] ?? 'text',
            'image'             => $data['image'] ?? null,
            'choices'           => json_encode($choices),
            'correct_answer'    => (int) ($data['correctAnswer'] ?? 0),
            'label_style'       => $data['labelStyle'] ?? 'ar',
        ]);
        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $set = [];
        $params = ['id' => $id];

        $map = [
            'text'            => 'text',
            'type'            => 'type',
            'image'           => 'image',
            'correctAnswer'   => 'correct_answer',
            'labelStyle'      => 'label_style',
            'questionGroupId' => 'question_group_id',
        ];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $value = $data[$inputKey];
            if ($inputKey === 'correctAnswer') {
                $value = (int) $value;
            } elseif ($inputKey === 'questionGroupId') {
                $value = (int) $value;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }
        if (array_key_exists('choices', $data)) {
            $choices = array_map(fn ($c) => (string) $c, array_values((array) $data['choices']));
            $set[] = 'choices = :choices';
            $params['choices'] = json_encode($choices);
        }

        if (!$set) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE questions SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM questions WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
