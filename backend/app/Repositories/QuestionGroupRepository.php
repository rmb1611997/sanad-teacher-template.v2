<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\QuestionGroup;

class QuestionGroupRepository extends BaseRepository
{
    /** @return QuestionGroup[] */
    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM question_groups ORDER BY created_at DESC');
        return array_map(fn ($row) => new QuestionGroup($row), $stmt->fetchAll());
    }

    public function find(int $id): ?QuestionGroup
    {
        $stmt = $this->db->prepare('SELECT * FROM question_groups WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new QuestionGroup($row) : null;
    }

    public function create(array $data): QuestionGroup
    {
        $stmt = $this->db->prepare(
            'INSERT INTO question_groups (name, grade, description, created_at) VALUES (:name, :grade, :description, NOW())'
        );
        $stmt->execute([
            'name'        => $data['name'] ?? '',
            'grade'       => $data['grade'] ?? null,
            'description' => $data['description'] ?? null,
        ]);
        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $data): void
    {
        $map = ['name' => 'name', 'grade' => 'grade', 'description' => 'description'];
        $set = [];
        $params = ['id' => $id];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $data[$inputKey];
        }
        if (!$set) {
            return;
        }
        $stmt = $this->db->prepare('UPDATE question_groups SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM question_groups WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
