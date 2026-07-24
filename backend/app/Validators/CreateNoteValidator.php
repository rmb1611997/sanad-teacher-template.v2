<?php

namespace App\Validators;

/**
 * The original sanad_teacher_create_note() had no required-field validation
 * at all (not even title). We still require courseId here because the new
 * schema enforces a NOT NULL foreign key on notes.course_id (§ Phase 3
 * report) — the original could silently store an orphaned/course-less note
 * via an unset ACF relationship field, which a real FK constraint cannot
 * represent. This is the one deliberate, minimal behavior tightening in
 * this phase, required by "use Foreign Keys" — not a feature change.
 */
class CreateNoteValidator extends Validator
{
    public function rules(): array
    {
        return [
            'courseId' => ['required'],
        ];
    }
}
