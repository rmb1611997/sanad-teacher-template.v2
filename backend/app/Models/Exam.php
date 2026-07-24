<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_exam() teacher-facing shape exactly. */
class Exam extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function groupId(): ?int
    {
        return $this->get('group_id') !== null ? (int) $this->get('group_id') : null;
    }

    public function questionGroupId(): ?int
    {
        return $this->get('question_group_id') !== null ? (int) $this->get('question_group_id') : null;
    }

    public function maxAttempts(): int
    {
        return (int) $this->get('max_attempts', 1);
    }

    public function passingScore(): int
    {
        return (int) $this->get('passing_score', 50);
    }

    public function totalScore(): int
    {
        return (int) $this->get('total_score', 100);
    }

    public function showResult(): bool
    {
        return (bool) $this->get('show_result', true);
    }

    public function toArray(): array
    {
        return [
            'id'               => $this->id(),
            'title'            => $this->get('title'),
            'courseId'         => (int) $this->get('course_id'),
            'groupId'          => $this->groupId(),
            'questionGroupId'  => $this->questionGroupId(),
            'duration'         => (int) $this->get('duration', 30),
            'maxAttempts'      => $this->maxAttempts(),
            'passingScore'     => $this->passingScore(),
            'totalScore'       => $this->totalScore(),
            'shuffleQuestions' => (bool) $this->get('shuffle_questions'),
            'showResult'       => $this->showResult(),
            'isGate'           => (bool) $this->get('is_gate'),
            'hasSchedule'      => (bool) $this->get('has_schedule'),
            'showFrom'         => $this->get('show_from'),
            'hideTo'           => $this->get('hide_to'),
            'createdAt'        => $this->get('created_at'),
        ];
    }
}
