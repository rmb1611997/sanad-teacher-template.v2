<?php

namespace App\Repositories;

use App\Core\BaseRepository;
use App\Models\User;

class UserRepository extends BaseRepository
{
    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function findByPhone(string $phone): ?User
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function phoneExists(string $phone): bool
    {
        return $this->findByPhone($phone) !== null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users
                (phone, parent_phone, password_hash, full_name, role, governorate, gender, grade, education_type, student_code, permissions, created_at)
             VALUES (:phone, :parent_phone, :password_hash, :full_name, :role, :governorate, :gender, :grade, :education_type, :student_code, :permissions, NOW())'
        );
        $stmt->execute([
            'phone'          => $data['phone'],
            'parent_phone'   => $data['parent_phone'] ?? null,
            'password_hash'  => $data['password_hash'],
            'full_name'      => $data['full_name'],
            'role'           => $data['role'] ?? 'student',
            'governorate'    => $data['governorate'] ?? null,
            'gender'         => $data['gender'] ?? null,
            'grade'          => $data['grade'] ?? null,
            'education_type' => $data['education_type'] ?? null,
            'student_code'   => $data['student_code'] ?? null,
            'permissions'    => isset($data['permissions']) ? json_encode($data['permissions']) : null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function generateUniqueStudentCode(): string
    {
        do {
            $code = (string) random_int(100000, 999999);
            $stmt = $this->db->prepare('SELECT id FROM users WHERE student_code = ? LIMIT 1');
            $stmt->execute([$code]);
        } while ($stmt->fetch());

        return $code;
    }

    /** Phase 5 addition: all users with role='student', platform-wide (matches get_users(['role'=>'sanad_student']), no per-teacher scoping on this single-tenant platform). */
    public function allStudents(): array
    {
        $stmt = $this->db->query("SELECT * FROM users WHERE role = 'student' ORDER BY id ASC");
        return array_map(fn ($row) => new User($row), $stmt->fetchAll());
    }

    /** Phase 5 addition: distinct (grade, count) pairs across ALL users with a non-null grade (matches the original's usermeta-wide query, not role-filtered). */
    public function countsByGrade(): array
    {
        $stmt = $this->db->query(
            "SELECT grade AS name, COUNT(*) AS students FROM users WHERE grade IS NOT NULL AND grade != '' GROUP BY grade"
        );
        return $stmt->fetchAll();
    }

    /** Phase 5 addition: distinct (governorate, count) pairs across ALL users (matches the original's usermeta-wide query). */
    public function countsByGovernorate(): array
    {
        $stmt = $this->db->query(
            "SELECT governorate AS name, COUNT(*) AS value FROM users WHERE governorate IS NOT NULL AND governorate != '' GROUP BY governorate"
        );
        return $stmt->fetchAll();
    }

    /** Phase 6 addition: matches sanad_teacher_get_students' orderby=registered DESC. */
    public function studentsOrderedByNewest(): array
    {
        $stmt = $this->db->query("SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC");
        return array_map(fn ($row) => new User($row), $stmt->fetchAll());
    }

    public function findStudent(int $id): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ? AND role = 'student' LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function updateStudent(int $id, array $fields): void
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
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $set) . " WHERE id = :id AND role = 'student'");
        $stmt->execute($params);
    }

    public function deleteById(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
