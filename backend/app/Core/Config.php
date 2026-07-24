<?php

namespace App\Core;

/**
 * Loads and caches the PHP array config files under config/*.php.
 * Usage: Config::get('security.jwt_secret'), Config::get('database.host').
 */
class Config
{
    private static array $cache = [];
    private static string $configPath;

    public static function init(string $configPath): void
    {
        self::$configPath = rtrim($configPath, '/');
    }

    public static function get(string $key, $default = null)
    {
        [$file, $path] = array_pad(explode('.', $key, 2), 2, null);

        if (!isset(self::$cache[$file])) {
            $fullPath = self::$configPath . '/' . $file . '.php';
            self::$cache[$file] = is_file($fullPath) ? require $fullPath : [];
        }

        if ($path === null) {
            return self::$cache[$file];
        }

        $value = self::$cache[$file];
        foreach (explode('.', $path) as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }
}
