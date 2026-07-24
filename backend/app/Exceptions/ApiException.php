<?php

namespace App\Exceptions;

class ApiException extends \Exception
{
    public string $errorCode;
    public int $status;
    public array $extra;

    public function __construct(string $errorCode, string $message, int $status = 400, array $extra = [])
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
        $this->status = $status;
        $this->extra = $extra;
    }
}
