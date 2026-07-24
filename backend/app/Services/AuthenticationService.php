<?php

namespace App\Services;

use App\Core\Config;
use App\Core\Logger;
use App\Exceptions\ApiException;
use App\Exceptions\RateLimitException;
use App\Helpers\Password;
use App\Models\User;
use App\Repositories\UserRepository;

/**
 * Business logic for register/login/logout/session — kept out of the
 * controller so AuthController stays a thin HTTP adapter.
 */
class AuthenticationService
{
    private UserRepository $users;

    public function __construct()
    {
        $this->users = new UserRepository();
    }

    public function sessionPayload(User $user): array
    {
        return array_merge($user->toArray(), [
            'success'   => true,
            'loggedIn'  => true,
            'csrfToken' => CsrfService::issue($user->id()),
        ]);
    }

    public function login(string $username, string $password, bool $remember, string $clientIp): array
    {
        $rlKey = 'login_' . $clientIp . '_' . $username;
        $max = Config::get('security.rate_limit_login_max', 5);
        $window = Config::get('security.rate_limit_login_window', 900);

        if (!RateLimiter::attempt($rlKey, $max, $window)) {
            Logger::security('login rate limit exceeded', ['ip' => $clientIp, 'username' => $username]);
            throw new RateLimitException('محاولات دخول كثيرة، حاول بعد 15 دقيقة');
        }

        $user = $this->users->findByPhone($username);
        if (!$user || !Password::verify($password, $user->get('password_hash'))) {
            Logger::security('login failed', ['ip' => $clientIp, 'username' => $username]);
            throw new ApiException('sanad_auth_invalid_credentials', 'بيانات الدخول غير صحيحة', 403);
        }

        RateLimiter::reset($rlKey);
        AuthService::issueCookie($user->id(), $remember);
        Logger::auth('login success', ['user_id' => $user->id()]);

        return $this->sessionPayload($user);
    }

    public function register(array $data, string $clientIp): array
    {
        $max = Config::get('security.rate_limit_register_max', 5);
        $window = Config::get('security.rate_limit_register_window', 300);

        if (!RateLimiter::attempt('register_' . $clientIp, $max, $window)) {
            throw new RateLimitException('محاولات كثيرة — انتظر 5 دقائق');
        }

        if ($this->users->phoneExists($data['studentPhone'])) {
            throw new ApiException('phone_exists', 'رقم الهاتف مسجل بالفعل', 409, ['field' => 'studentPhone']);
        }

        $studentCode = $this->users->generateUniqueStudentCode();

        $userId = $this->users->create([
            'phone'          => $data['studentPhone'],
            'parent_phone'   => $data['parentPhone'] ?: null,
            'password_hash'  => Password::hash($data['password']),
            'full_name'      => $data['fullName'],
            'role'           => 'student',
            'governorate'    => $data['governorate'] ?: null,
            'gender'         => $data['gender'] ?: null,
            'grade'          => $data['grade'] ?: null,
            'education_type' => $data['educationType'] ?: null,
            'student_code'   => $studentCode,
        ]);

        $user = $this->users->findById($userId);
        AuthService::issueCookie($userId, false);
        Logger::auth('register success', ['user_id' => $userId]);

        return $this->sessionPayload($user);
    }
}
