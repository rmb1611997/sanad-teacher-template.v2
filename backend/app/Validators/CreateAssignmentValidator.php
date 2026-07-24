<?php

namespace App\Validators;

/** Same FK-integrity reasoning as CreateNoteValidator (Phase 3): courseId is required by the schema's NOT NULL FK. */
class CreateAssignmentValidator extends Validator
{
    public function rules(): array
    {
        return [
            'courseId' => ['required'],
        ];
    }
}
