<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_video() teacher-facing shape exactly. */
class Video extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function isFree(): bool
    {
        return (bool) $this->get('is_free');
    }

    public function isGate(): bool
    {
        return (bool) $this->get('is_gate');
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
            'provider'    => $this->get('provider'),
            'duration'    => $this->get('duration') !== null ? (int) $this->get('duration') : null,
            'thumbnail'   => $this->get('thumbnail'),
            'isFree'      => $this->isFree(),
            'isGate'      => $this->isGate(),
            'hasSchedule' => (bool) $this->get('has_schedule'),
            'showFrom'    => $this->get('show_from'),
            'hideTo'      => $this->get('hide_to'),
            'courseId'    => (int) $this->get('course_id'),
            'groupId'     => $this->groupId(),
            'createdAt'   => $this->get('created_at'),
        ];
    }
}
