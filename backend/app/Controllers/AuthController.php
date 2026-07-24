<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Middleware\Auth;
use App\Services\AuthenticationService;
use App\Services\AuthService;
use App\Validators\LoginValidator;
use App\Validators\RegisterValidator;

class AuthController extends BaseController
{
    private AuthenticationService $auth;

    public function __construct()
    {
        $this->auth = new AuthenticationService();
    }

    public function login(Request $request): void
    {
        $data = (new LoginValidator())->validate($request->all());
        $remember = (bool) $request->input('remember', false);

        $payload = $this->auth->login($data['username'], $data['password'], $remember, $request->clientIp());

        $this->json($payload);
    }

    public function register(Request $request): void
    {
        $data = (new RegisterValidator())->validate($request->all());

        $payload = $this->auth->register($data, $request->clientIp());

        $this->json($payload, 201);
    }

    public function logout(Request $request): void
    {
        AuthService::clearCookie();
        $this->json(['success' => true]);
    }

    public function session(Request $request): void
    {
        if (!$request->user) {
            $this->json(['success' => true, 'loggedIn' => false]);
        }

        $user = Auth::requireLogin($request);
        $this->json($this->auth->sessionPayload($user));
    }
}
