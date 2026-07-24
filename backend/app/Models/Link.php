<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_link() shape exactly. */
class Link extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function groupId(): ?int
    {
        return $this->get('group_id') !== null ? (int) $this->get('group_id') : null;
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'title'       => $this->get('title'),
            'description' => $this->get('description'),
            'url'         => $this->get('url'),
            'hasSchedule' => (bool) $this->get('has_schedule'),
            'showFrom'    => $this->get('show_from'),
            'hideTo'      => $this->get('hide_to'),
            'courseId'    => (int) $this->get('course_id'),
            'groupId'     => $this->groupId(),
            'createdAt'   => $this->get('created_at'),
        ];
    }
}
