<?php

namespace App\Models;

use App\Core\BaseModel;

class User extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function role(): string
    {
        return (string) $this->get('role');
    }

    public function isTeacherArea(): bool
    {
        return in_array($this->role(), ['teacher', 'staff'], true);
    }

    public function isOwnerTeacher(): bool
    {
        return $this->role() === 'teacher';
    }

    public function permissions(): ?array
    {
        if ($this->role() !== 'staff') {
            return null;
        }
        $decoded = json_decode($this->get('permissions', '[]') ?? '[]', true);
        return is_array($decoded) ? array_values($decoded) : [];
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'name'        => $this->get('full_name'),
            'phone'       => $this->get('phone'),
            'role'        => $this->isTeacherArea() ? 'teacher' : 'student',
            'permissions' => $this->permissions(),
        ];
    }
}
