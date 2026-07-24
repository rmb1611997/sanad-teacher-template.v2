<?php

namespace App\Validators;

/** See CreateNoteValidator's docblock — same reasoning applies here. */
class CreateLinkValidator extends Validator
{
    public function rules(): array
    {
        return [
            'courseId' => ['required'],
        ];
    }
}
