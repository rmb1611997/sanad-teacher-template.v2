<?php

namespace App\Validators;

class LoginValidator extends Validator
{
    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }
}
