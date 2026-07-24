<?php

namespace App\Models;

use App\Core\BaseModel;

/** Matches the original sanad_format_course() shape exactly. */
class Course extends BaseModel
{
    public function id(): int
    {
        return (int) $this->get('id');
    }

    public function isFree(): bool
    {
        return (bool) $this->get('is_free');
    }

    public function toArray(): array
    {
        return [
            'id'               => $this->id(),
            'title'            => $this->get('title'),
            'description'      => $this->get('description'),
            'shortDescription' => $this->get('short_description'),
            'grade'            => $this->get('grade'),
            'category'         => $this->get('category'),
            'price'            => (int) $this->get('price', 0),
            'discountPrice'    => $this->get('discount_price') !== null ? (int) $this->get('discount_price') : null,
            'isFree'           => $this->isFree(),
            'image'            => $this->get('image'),
            'createdAt'        => $this->get('created_at'),
            'updatedAt'        => $this->get('updated_at'),
        ];
    }
}
