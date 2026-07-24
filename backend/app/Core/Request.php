<?php

namespace App\Core;

class Request
{
    public string $method;
    public string $path;
    private array $json;
    public array $query;
    public array $params = [];
    public ?int $userId = null;
    public ?array $user = null;

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $this->path = rtrim($uri, '/') ?: '/';

        $this->query = $_GET;

        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);
        $this->json = is_array($decoded) ? $decoded : [];
    }

    public function input(string $key, $default = null)
    {
        return $this->json[$key] ?? $this->query[$key] ?? $default;
    }

    public function all(): array
    {
        return $this->json;
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function cookie(string $name): ?string
    {
        return $_COOKIE[$name] ?? null;
    }

    public function clientIp(): string
    {
        $trusted = array_filter((array) Config::get('security.trusted_proxies', []));
        if ($trusted && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']));
            if (in_array($_SERVER['REMOTE_ADDR'] ?? '', $trusted, true)) {
                return $parts[0];
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
