<?php

namespace App\Validators;

class CreateCourseValidator extends Validator
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
        ];
    }
}
