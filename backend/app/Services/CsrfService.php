<?php

namespace App\Services;

use App\Core\Config;

class CsrfService
{
    private const TTL = 60 * 60 * 24 * 2;

    public static function issue(int $userId): string
    {
        $expires = time() + self::TTL;
        $signature = self::sign($userId, $expires);
        return base64_encode("$userId.$expires.$signature");
    }

    public static function verify(int $userId, ?string $token): bool
    {
        if (!$token) {
            return false;
        }

        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return false;
        }

        $parts = explode('.', $decoded);
        if (count($parts) !== 3) {
            return false;
        }

        [$tokenUserId, $expires, $signature] = $parts;

        if ((int) $tokenUserId !== $userId) {
            return false;
        }
        if ((int) $expires < time()) {
            return false;
        }

        return hash_equals(self::sign((int) $tokenUserId, (int) $expires), $signature);
    }

    private static function sign(int $userId, int $expires): string
    {
        return hash_hmac('sha256', "$userId.$expires", Config::get('security.csrf_secret'));
    }
}
