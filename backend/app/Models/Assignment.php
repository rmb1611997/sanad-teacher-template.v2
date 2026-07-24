<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_assignment() shape exactly. */
class Assignment extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function groupId(): ?int
    {
        return $this->get('group_id') !== null ? (int) $this->get('group_id') : null;
    }

    public function allowText(): bool
    {
        return (bool) $this->get('allow_text', true);
    }

    public function allowFile(): bool
    {
        return (bool) $this->get('allow_file', false);
    }

    public function allowImage(): bool
    {
        return (bool) $this->get('allow_image', false);
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'title'       => $this->get('title'),
            'description' => $this->get('description'),
            'courseId'    => (int) $this->get('course_id'),
            'groupId'     => $this->groupId(),
            'allowText'   => $this->allowText(),
            'allowFile'   => $this->allowFile(),
            'allowImage'  => $this->allowImage(),
            'hasDeadline' => (bool) $this->get('has_deadline'),
            'dueDate'     => $this->get('due_date'),
            'isGate'      => (bool) $this->get('is_gate'),
            'hasSchedule' => (bool) $this->get('has_schedule'),
            'showFrom'    => $this->get('show_from'),
            'createdAt'   => $this->get('created_at'),
        ];
    }
}
