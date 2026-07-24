<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_announcement() shape exactly. */
class Announcement extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function isPublished(): bool
    {
        return (bool) $this->get('is_published');
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id(),
            'title'       => $this->get('title'),
            'content'     => $this->get('content'),
            'linkUrl'     => $this->get('link_url'),
            'isPublished' => $this->isPublished(),
            'startDate'   => $this->get('start_date'),
            'endDate'     => $this->get('end_date'),
            'createdAt'   => $this->get('created_at'),
        ];
    }
}
