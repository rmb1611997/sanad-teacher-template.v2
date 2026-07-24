<?php

namespace App\Validators;

class RegisterValidator extends Validator
{
    public function rules(): array
    {
        return [
            'fullName'      => ['required', 'string', 'min:3', 'max:150'],
            'studentPhone'  => ['required', 'phone', 'different:parentPhone'],
            'parentPhone'   => ['phone'],
            'governorate'   => ['string', 'max:100'],
            'gender'        => ['in:male,female'],
            'grade'         => ['string', 'max:50'],
            'educationType' => ['string', 'max:50'],
            'password'      => ['required', 'string', 'min:6'],
        ];
    }
}
