<?php

namespace App\Repositories;

use App\Core\BaseRepository;

class SettingsRepository extends BaseRepository
{
    public function get(string $key, $default = null)
    {
        $stmt = $this->db->prepare('SELECT `value` FROM settings WHERE `key` = ? LIMIT 1');
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? json_decode($row['value'], true) : $default;
    }

    public function set(string $key, $value): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO settings (`key`, `value`) VALUES (:key, :value)
             ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)'
        );
        $stmt->execute(['key' => $key, 'value' => json_encode($value)]);
    }
}
