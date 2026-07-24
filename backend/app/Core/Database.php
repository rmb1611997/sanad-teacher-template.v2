<?php

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance === null) {
            $host = Config::get('database.host');
            $port = Config::get('database.port');
            $name = Config::get('database.name');
            $user = Config::get('database.user');
            $pass = Config::get('database.pass');

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

            try {
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];
                if (defined('PDO::MYSQL_ATTR_MULTI_STATEMENTS')) {
                    $options[PDO::MYSQL_ATTR_MULTI_STATEMENTS] = true;
                }

                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                Logger::error('db', 'Database connection failed: ' . $e->getMessage());
                throw $e;
            }
        }

        return self::$instance;
    }
}
