<?php

namespace App\Exceptions;

class RateLimitException extends ApiException
{
    public function __construct(string $message = 'محاولات كثيرة، حاول مرة أخرى لاحقًا')
    {
        parent::__construct('rate_limit', $message, 429);
    }
}
