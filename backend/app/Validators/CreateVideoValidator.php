<?php

namespace App\Validators;

class CreateVideoValidator extends Validator
{
    public function rules(): array
    {
        return [
            'title'    => ['required', 'string', 'max:255'],
            'courseId' => ['required'],
        ];
    }
}
