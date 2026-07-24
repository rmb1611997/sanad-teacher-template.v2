<?php

namespace App\Middleware;

use App\Core\Config;

class Cors
{
    public static function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = (array) Config::get('security.allowed_origins', []);

        if ($origin && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header("Referrer-Policy: strict-origin-when-cross-origin");
        // This is a pure JSON API — it never serves HTML/JS/CSS to be rendered directly,
        // so a maximally-restrictive policy is safe and matches the original's CSP header.
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
        if (Config::get('security.cookie_secure')) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }
}
