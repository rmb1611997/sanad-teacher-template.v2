<?php

namespace App\Exceptions;

class ForbiddenException extends ApiException
{
    public function __construct(string $message = 'غير مصرح لك بهذا الإجراء', string $errorCode = 'sanad_forbidden')
    {
        parent::__construct($errorCode, $message, 403);
    }
}
