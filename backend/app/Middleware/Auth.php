<?php

namespace App\Middleware;

use App\Core\Request;
use App\Exceptions\ForbiddenException;
use App\Exceptions\UnauthorizedException;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\AuthService;

class Auth
{
    /** Resolves the current user from the cookie onto the request, if present. Never throws. */
    public static function resolve(Request $request): void
    {
        $token = $request->cookie(\App\Core\Config::get('security.cookie_name'));
        $userId = AuthService::userIdFromCookie($token);
        if (!$userId) {
            return;
        }

        $user = (new UserRepository())->findById($userId);
        if ($user) {
            $request->userId = $userId;
            $request->user = $user->raw();
        }
    }

    public static function requireLogin(Request $request): User
    {
        if (!$request->user) {
            throw new UnauthorizedException('يجب تسجيل الدخول');
        }
        return new User($request->user);
    }

    public static function requireStudent(Request $request): User
    {
        return self::requireLogin($request);
    }

    public static function requireTeacherArea(Request $request): User
    {
        $user = self::requireLogin($request);
        if (!$user->isTeacherArea()) {
            throw new ForbiddenException('غير مصرح لك');
        }
        return $user;
    }

    public static function requireOwnerTeacher(Request $request): User
    {
        $user = self::requireLogin($request);
        if (!$user->isOwnerTeacher()) {
            throw new ForbiddenException('هذا الإجراء مخصص للمعلم فقط');
        }
        return $user;
    }
}
