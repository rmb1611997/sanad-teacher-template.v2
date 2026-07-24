<?php

use App\Core\Env;

return [
    'env'   => Env::get('APP_ENV', 'development'),
    'debug' => Env::bool('APP_DEBUG', false),
    'url'   => Env::get('APP_URL', 'http://localhost:8000'),
];
