<?php

namespace App\Exceptions;

/** Thrown by Validators. Carries a field => message[] error map. */
class ValidationException extends ApiException
{
    public function __construct(array $errors, string $message = 'بيانات غير صحيحة')
    {
        parent::__construct('validation_error', $message, 422, ['errors' => $errors]);
    }
}
