<?php

namespace App\Services;

use App\Core\Config;
use App\Core\Logger;

class AuthService
{
    public static function issueCookie(int $userId, bool $remember = false): string
    {
        $ttl = $remember
            ? Config::get('security.jwt_ttl_remember', 2592000)
            : Config::get('security.jwt_ttl', 172800);

        $payload = [
            'iat'  => time(),
            'exp'  => time() + $ttl,
            'data' => ['user' => ['id' => $userId]],
        ];

        $token = Jwt::encode($payload, Config::get('security.jwt_secret'));

        setcookie(Config::get('security.cookie_name'), $token, [
            'expires'  => time() + $ttl,
            'path'     => '/',
            'secure'   => (bool) Config::get('security.cookie_secure'),
            'httponly' => true,
            'samesite' => Config::get('security.cookie_samesite', 'Lax'),
        ]);

        Logger::auth('cookie issued', ['user_id' => $userId, 'remember' => $remember]);

        return $token;
    }

    public static function clearCookie(): void
    {
        setcookie(Config::get('security.cookie_name'), '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => (bool) Config::get('security.cookie_secure'),
            'httponly' => true,
            'samesite' => Config::get('security.cookie_samesite', 'Lax'),
        ]);
    }

    public static function userIdFromCookie(?string $token): ?int
    {
        if (!$token) {
            return null;
        }

        $decoded = Jwt::decode($token, Config::get('security.jwt_secret'));
        return isset($decoded['data']['user']['id']) ? (int) $decoded['data']['user']['id'] : null;
    }
}
