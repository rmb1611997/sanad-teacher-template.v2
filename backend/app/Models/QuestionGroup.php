<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_question_group() shape exactly. */
class QuestionGroup extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'name'        => $this->get('name'),
            'grade'       => $this->get('grade'),
            'description' => $this->get('description'),
        ];
    }
}
