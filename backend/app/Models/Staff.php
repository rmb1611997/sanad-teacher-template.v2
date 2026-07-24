<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_staff() response shape exactly. */
class Staff extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function permissions(): array
    {
        $decoded = json_decode($this->get('permissions', '[]') ?? '[]', true);
        return is_array($decoded) ? array_values($decoded) : [];
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'name'        => $this->get('full_name'),
            'phone'       => $this->get('phone'),
            'role'        => 'staff',
            'permissions' => $this->permissions(),
            'createdAt'   => $this->get('created_at'),
        ];
    }
}
