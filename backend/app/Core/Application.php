<?php

namespace App\Core;

use App\Middleware\Auth;
use App\Middleware\Cors;
use App\Middleware\Csrf;

class Application
{
    private string $basePath;

    public function __construct(string $basePath)
    {
        $this->basePath = rtrim($basePath, '/');
    }

    public function bootstrap(): Request
    {
        Env::load($this->basePath . '/.env');
        Config::init($this->basePath . '/config');
        Logger::init($this->basePath . '/storage');

        $this->guardProductionSecrets();

        set_exception_handler([ExceptionHandler::class, 'handle']);
        set_error_handler(function ($severity, $message, $file, $line) {
            if (!(error_reporting() & $severity)) {
                return false;
            }
            throw new \ErrorException($message, 0, $severity, $file, $line);
        });

        Cors::handle();

        $request = new Request();

        Auth::resolve($request);
        Csrf::guard($request);

        return $request;
    }

    public function run(Request $request): void
    {
        $router = new Router();
        $register = require $this->basePath . '/routes/api.php';
        $register($router);
        $router->dispatch($request);
    }

    /**
     * Refuses to boot in production if JWT_SECRET/CSRF_SECRET are missing, too short,
     * or still equal to a known placeholder value from .env.example/docs — prevents a
     * production deployment from silently running with a guessable/known secret.
     */
    private function guardProductionSecrets(): void
    {
        if (Config::get('app.env') !== 'production') {
            return;
        }

        $placeholders = [
            'change-me-to-a-long-random-string',
            'change-me-to-another-long-random-string',
            'insecure-dev-secret-change-me',
            'insecure-dev-csrf-secret-change-me',
        ];

        $missing = [];
        foreach (['JWT_SECRET' => 'security.jwt_secret', 'CSRF_SECRET' => 'security.csrf_secret'] as $envName => $configKey) {
            $value = Config::get($configKey);
            if (!$value || strlen($value) < 32 || in_array($value, $placeholders, true)) {
                $missing[] = $envName;
            }
        }

        if ($missing) {
            Logger::error('bootstrap', 'Refusing to start in production: missing or insecure secret(s)', ['vars' => $missing]);
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'error'   => true,
                'code'    => 'server_misconfigured',
                'message' => 'خطأ في إعدادات الخادم',
            ], JSON_UNESCAPED_UNICODE);
            exit(1);
        }
    }
}
