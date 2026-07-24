<?php

namespace App\Core;

class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $regex = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern);
        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => '#^' . $regex . '$#u',
            'handler' => $handler,
        ];
    }

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    public function dispatch(Request $request): void
    {
        if ($request->method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $pathMatchedOtherMethod = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $request->path, $matches)) {
                continue;
            }

            if ($route['method'] !== $request->method) {
                $pathMatchedOtherMethod = true;
                continue;
            }

            $request->params = array_filter($matches, fn ($k) => !is_int($k), ARRAY_FILTER_USE_KEY);

            try {
                ($route['handler'])($request);
            } catch (\Throwable $e) {
                ExceptionHandler::handle($e);
            }
            return;
        }

        if ($pathMatchedOtherMethod) {
            ExceptionHandler::handle(new \App\Exceptions\ApiException('method_not_allowed', 'Method not allowed', 405));
        } else {
            ExceptionHandler::handle(new \App\Exceptions\ApiException('not_found', 'المسار غير موجود', 404));
        }
    }
}
