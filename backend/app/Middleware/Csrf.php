<?php

namespace App\Middleware;

use App\Core\Request;
use App\Exceptions\ApiException;
use App\Services\CsrfService;

class Csrf
{
    private const EXEMPT_PATHS = ['/sanad/v1/auth/login', '/sanad/v1/register'];
    private const MUTATING = ['POST', 'PUT', 'DELETE'];

    public static function guard(Request $request): void
    {
        if (!in_array($request->method, self::MUTATING, true)) {
            return;
        }
        if (in_array($request->path, self::EXEMPT_PATHS, true)) {
            return;
        }
        $isGuarded = str_starts_with($request->path, '/sanad/') || str_starts_with($request->path, '/wp/v2/');
        if (!$isGuarded) {
            return;
        }
        if (!$request->user) {
            // No session yet — the route's own auth check will produce the 401.
            return;
        }

        $token = $request->header('X-CSRF-Token');
        if (!CsrfService::verify((int) $request->user['id'], $token)) {
            throw new ApiException('sanad_csrf_invalid', 'انتهت صلاحية الجلسة، أعد تحميل الصفحة', 403);
        }
    }
}
