<?php

use App\Core\Env;

return [
    'jwt_secret'       => Env::get('JWT_SECRET'),
    'jwt_ttl'          => Env::int('JWT_TTL', 172800),
    'jwt_ttl_remember' => Env::int('JWT_TTL_REMEMBER', 2592000),

    'csrf_secret' => Env::get('CSRF_SECRET'),

    'cookie_name'     => Env::get('COOKIE_NAME', 'sanad_auth_token'),
    'cookie_secure'   => Env::bool('COOKIE_SECURE', false),
    'cookie_samesite' => Env::get('COOKIE_SAMESITE', 'Lax'),

    'allowed_origins' => array_filter(array_map('trim', explode(',', Env::get('ALLOWED_ORIGINS', 'http://localhost:5173')))),

    'rate_limit_login_max'      => Env::int('RATE_LIMIT_LOGIN_MAX', 5),
    'rate_limit_login_window'   => Env::int('RATE_LIMIT_LOGIN_WINDOW', 900),
    'rate_limit_register_max'    => Env::int('RATE_LIMIT_REGISTER_MAX', 5),
    'rate_limit_register_window' => Env::int('RATE_LIMIT_REGISTER_WINDOW', 300),

    'trusted_proxies' => array_filter(array_map('trim', explode(',', Env::get('TRUSTED_PROXIES', '')))),
];
