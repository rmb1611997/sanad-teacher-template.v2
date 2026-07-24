<?php

namespace App\Core;

/**
 * File-based logging into storage/logs/, split by channel: application.log,
 * security.log, auth.log, error.log. One JSON-ish line per entry.
 */
class Logger
{
    private static string $dir;

    public static function init(string $storagePath): void
    {
        self::$dir = rtrim($storagePath, '/') . '/logs';
        if (!is_dir(self::$dir)) {
            mkdir(self::$dir, 0775, true);
        }
    }

    public static function application(string $message, array $context = []): void
    {
        self::write('application', 'INFO', $message, $context);
    }

    public static function security(string $message, array $context = []): void
    {
        self::write('security', 'WARNING', $message, $context);
    }

    public static function auth(string $message, array $context = []): void
    {
        self::write('auth', 'INFO', $message, $context);
    }

    public static function error(string $channel, string $message, array $context = []): void
    {
        self::write('error', 'ERROR', "[$channel] $message", $context);
    }

    private static function write(string $channel, string $level, string $message, array $context): void
    {
        $line = sprintf(
            '[%s] %s: %s %s%s',
            date('Y-m-d H:i:s'),
            $level,
            $message,
            $context ? json_encode($context, JSON_UNESCAPED_UNICODE) : '',
            PHP_EOL
        );

        $file = self::$dir . "/{$channel}.log";
        file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
    }
}
