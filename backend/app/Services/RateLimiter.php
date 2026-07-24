<?php

namespace App\Services;

/**
 * File-backed sliding-window rate limiter. One JSON file per key under
 * storage/ratelimit, holding an attempt count and a window expiry.
 */
class RateLimiter
{
    private static function dir(): string
    {
        $dir = dirname(__DIR__, 2) . '/storage/ratelimit';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        return $dir;
    }

    private static function path(string $key): string
    {
        return self::dir() . '/' . hash('sha256', $key) . '.json';
    }

    public static function attempt(string $key, int $maxAttempts, int $windowSeconds): bool
    {
        $file = self::path($key);
        $now = time();

        // Open (creating if needed) and hold an exclusive lock across the whole
        // read-modify-write so concurrent requests for the same key can't race
        // past the attempt-count check (was: plain file_get_contents/file_put_contents).
        $handle = fopen($file, 'c+');
        if ($handle === false) {
            // Fail open would defeat the limiter's purpose; fail closed instead.
            return false;
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                return false;
            }

            $raw = stream_get_contents($handle);
            $data = ['count' => 0, 'expires' => $now + $windowSeconds];
            if ($raw !== false && $raw !== '') {
                $stored = json_decode($raw, true);
                if (is_array($stored) && ($stored['expires'] ?? 0) > $now) {
                    $data = $stored;
                }
            }

            if ($data['count'] >= $maxAttempts) {
                return false;
            }

            $data['count']++;

            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode($data));
            fflush($handle);

            return true;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    public static function reset(string $key): void
    {
        $file = self::path($key);
        if (!is_file($file)) {
            return;
        }

        $handle = fopen($file, 'r+');
        if ($handle === false) {
            return;
        }
        flock($handle, LOCK_EX);
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode(['count' => 0, 'expires' => 0]));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}
