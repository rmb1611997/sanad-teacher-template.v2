<?php

namespace App\Validators;

class CreateStaffValidator extends Validator
{
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'min:2', 'max:150'],
            'phone'    => ['required', 'phone'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }
}
