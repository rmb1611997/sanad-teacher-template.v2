<?php

namespace App\Core;

abstract class BaseController
{
    protected function json(array $data, int $status = 200): void
    {
        Response::json($data, $status);
    }
}
