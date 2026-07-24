<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_group() shape exactly. */
class Group extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'title'       => $this->get('title'),
            'description' => $this->get('description'),
            'courseId'    => (int) $this->get('course_id'),
            'hasSchedule' => (bool) $this->get('has_schedule'),
            'showFrom'    => $this->get('show_from'),
            'hideTo'      => $this->get('hide_to'),
            'createdAt'   => $this->get('created_at'),
        ];
    }
}
