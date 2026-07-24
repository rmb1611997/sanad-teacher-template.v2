<?php

namespace App\Core;

/**
 * Plain data-holder base for entity models: wraps a DB row (assoc array,
 * snake_case) and exposes a camelCase API-facing representation via toArray().
 */
abstract class BaseModel
{
    protected array $attributes;

    public function __construct(array $attributes)
    {
        $this->attributes = $attributes;
    }

    public function get(string $key, $default = null)
    {
        return $this->attributes[$key] ?? $default;
    }

    public function raw(): array
    {
        return $this->attributes;
    }

    /** camelCase representation for API responses. Override per model as needed. */
    abstract public function toArray(): array;
}
