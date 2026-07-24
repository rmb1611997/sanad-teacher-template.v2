<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Course;

class CourseRepository extends BaseRepository
{
    /** @return Course[] */
    public function all(?string $grade = null): array
    {
        if ($grade) {
            $stmt = $this->db->prepare('SELECT * FROM courses WHERE grade = ? ORDER BY created_at DESC');
            $stmt->execute([$grade]);
        } else {
            $stmt = $this->db->query('SELECT * FROM courses ORDER BY created_at DESC');
        }
        return array_map(fn ($row) => new Course($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Course
    {
        $stmt = $this->db->prepare('SELECT * FROM courses WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Course($row) : null;
    }

    public function create(array $data): Course
    {
        $stmt = $this->db->prepare(
            'INSERT INTO courses (title, description, short_description, grade, category, price, discount_price, is_free, image, created_at)
             VALUES (:title, :description, :short_description, :grade, :category, :price, :discount_price, :is_free, :image, NOW())'
        );
        $stmt->execute([
            'title'              => $data['title'],
            'description'        => $data['description'] ?? null,
            'short_description'  => $data['shortDescription'] ?? null,
            'grade'              => $data['grade'] ?? null,
            'category'           => $data['category'] ?? null,
            'price'              => (int) ($data['price'] ?? 0),
            'discount_price'     => isset($data['discountPrice']) ? (int) $data['discountPrice'] : null,
            'is_free'            => !empty($data['isFree']) ? 1 : 0,
            'image'              => $data['image'] ?? null,
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    /** Partial update — only columns present in $data (isset-per-field, matching the original). */
    public function update(int $id, array $data): void
    {
        $map = [
            'title'             => 'title',
            'description'       => 'description',
            'shortDescription'  => 'short_description',
            'grade'             => 'grade',
            'category'          => 'category',
            'price'             => 'price',
            'discountPrice'     => 'discount_price',
            'isFree'            => 'is_free',
            'image'             => 'image',
        ];

        $set = [];
        $params = ['id' => $id];
        foreach ($map as $inputKey => $column) {
            if (!array_key_exists($inputKey, $data)) {
                continue;
            }
            $value = $data[$inputKey];
            if ($inputKey === 'isFree') {
                $value = !empty($value) ? 1 : 0;
            }
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }

        if (!$set) {
            return;
        }

        $stmt = $this->db->prepare('UPDATE courses SET ' . implode(', ', $set) . ' WHERE id = :id');
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM courses WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
