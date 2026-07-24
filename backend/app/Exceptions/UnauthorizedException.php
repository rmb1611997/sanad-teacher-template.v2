<?php

namespace App\Exceptions;

class UnauthorizedException extends ApiException
{
    public function __construct(string $message = 'يجب تسجيل الدخول', string $errorCode = 'sanad_unauthorized')
    {
        parent::__construct($errorCode, $message, 401);
    }
}
