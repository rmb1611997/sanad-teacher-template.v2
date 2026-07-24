<?php

/**
 * Seeds the one real teacher account (idempotent).
 * Run: php database/seeders/UsersSeeder.php [phone] [password] [fullName]
 */

require dirname(__DIR__, 2) . '/app/Core/Autoload.php';

use App\Core\Config;
use App\Core\Database;
use App\Core\Env;
use App\Helpers\Password;
use App\Repositories\UserRepository;

$basePath = dirname(__DIR__, 2);
Env::load($basePath . '/.env');
Config::init($basePath . '/config');

$phone = $argv[1] ?? '01000000000';
$password = $argv[2] ?? 'ChangeMe123!';
$fullName = $argv[3] ?? 'Teacher';

$users = new UserRepository();

if ($users->phoneExists($phone)) {
    echo "Teacher with phone {$phone} already exists, skipping.\n";
    exit(0);
}

$id = $users->create([
    'phone'         => $phone,
    'password_hash' => Password::hash($password),
    'full_name'     => $fullName,
    'role'          => 'teacher',
]);

echo "Seeded teacher #{$id} — phone: {$phone}, password: {$password}\n";
