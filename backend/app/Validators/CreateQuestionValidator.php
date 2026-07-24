<?php

namespace App\Validators;

/** questionGroupId is required by the schema's NOT NULL FK (question_group_id). */
class CreateQuestionValidator extends Validator
{
    public function rules(): array
    {
        return [
            'questionGroupId' => ['required'],
        ];
    }
}
