<?php

namespace App\Validators;

class UpdateStaffValidator extends Validator
{
    public function rules(): array
    {
        return [
            'name'     => ['string', 'min:2', 'max:150'],
            'password' => ['string', 'min:6'],
        ];
    }
}
