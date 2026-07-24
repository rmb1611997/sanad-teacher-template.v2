<?php

namespace App\Validators;

/** The original has no required-field validation for question groups (unlike course/group/video/exam titles). */
class CreateQuestionGroupValidator extends Validator
{
    public function rules(): array
    {
        return [
            'name' => ['string', 'max:255'],
        ];
    }
}
