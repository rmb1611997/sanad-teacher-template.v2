<?php

/**
 * Tiny migration runner: applies each database/migrations/*.sql file once,
 * in filename order, tracking what's already been applied in a
 * `migrations` bookkeeping table. Run: php database/migrate.php
 */

require dirname(__DIR__) . '/app/Core/Autoload.php';

use App\Core\Config;
use App\Core\Database;
use App\Core\Env;

$basePath = dirname(__DIR__);
Env::load($basePath . '/.env');
Config::init($basePath . '/config');

$db = Database::connection();

$db->exec(
    'CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
);

$applied = $db->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);

$files = glob($basePath . '/database/migrations/*.sql');
sort($files);

foreach ($files as $file) {
    $name = basename($file);
    if (in_array($name, $applied, true)) {
        echo "SKIP  {$name} (already applied)\n";
        continue;
    }

    $sql = file_get_contents($file);
    echo "APPLY {$name}\n";
    $db->exec($sql);

    $stmt = $db->prepare('INSERT INTO migrations (migration) VALUES (?)');
    $stmt->execute([$name]);
}

echo "Migrations up to date.\n";
