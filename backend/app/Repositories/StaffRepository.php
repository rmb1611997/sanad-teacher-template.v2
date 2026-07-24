<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\Staff;

class StaffRepository extends BaseRepository
{
    /** @return Staff[] */
    public function all(): array
    {
        $stmt = $this->db->query("SELECT * FROM users WHERE role = 'staff' ORDER BY created_at DESC");
        return array_map(fn ($row) => new Staff($row), $stmt->fetchAll());
    }

    public function find(int $id): ?Staff
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ? AND role = 'staff' LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new Staff($row) : null;
    }

    public function phoneExists(string $phone): bool
    {
        $stmt = $this->db->prepare('SELECT id FROM users WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
        return (bool) $stmt->fetch();
    }

    public function create(string $phone, string $passwordHash, string $fullName, array $permissions): Staff
    {
        $stmt = $this->db->prepare(
            "INSERT INTO users (phone, password_hash, full_name, role, permissions, created_at)
             VALUES (:phone, :password_hash, :full_name, 'staff', :permissions, NOW())"
        );
        $stmt->execute([
            'phone'         => $phone,
            'password_hash' => $passwordHash,
            'full_name'     => $fullName,
            'permissions'   => json_encode($permissions),
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $fields): void
    {
        if (!$fields) {
            return;
        }

        $set = [];
        $params = ['id' => $id];
        foreach ($fields as $column => $value) {
            $set[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }

        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $set) . " WHERE id = :id AND role = 'staff'");
        $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ? AND role = 'staff'");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
