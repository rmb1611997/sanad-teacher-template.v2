<?php

namespace App\Models;

use App\Core\BaseModel;

class Question extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function choices(): array
    {
        $decoded = json_decode($this->get('choices', '[]') ?? '[]', true);
        return is_array($decoded) ? array_values($decoded) : ['', '', '', ''];
    }

    public function correctAnswer(): int
    {
        return (int) $this->get('correct_answer', 0);
    }

    /** Teacher "question bank" shape — includes correctAnswer (sanad_format_question). */
    public function toArray(): array
    {
        return [
            'id'              => $this->id(),
            'text'            => $this->get('text'),
            'type'            => $this->get('type'),
            'image'           => $this->get('image'),
            'choices'         => $this->choices(),
            'correctAnswer'   => $this->correctAnswer(),
            'questionGroupId' => (int) $this->get('question_group_id'),
            'labelStyle'      => $this->get('label_style'),
        ];
    }

    /**
     * Student-facing shape used inside GET /exams/{id} and the submit-review
     * array: choices become {id,text} objects keyed by stringified index,
     * correctAnswer is NEVER included here (matches the original exactly).
     */
    public function toStudentArray(): array
    {
        $choices = array_map(
            fn ($text, $index) => ['id' => (string) $index, 'text' => $text],
            $this->choices(),
            array_keys($this->choices())
        );

        return [
            'id'         => $this->id(),
            'text'       => $this->get('text'),
            'type'       => $this->get('type'),
            'image'      => $this->get('image'),
            'labelStyle' => $this->get('label_style'),
            'choices'    => $choices,
        ];
    }
}
