<?php

namespace App\Validators;

use App\Exceptions\ValidationException;

/**
 * Minimal rule-based validator. Controllers must not contain validation
 * logic — they call a Validator, which throws ValidationException(422) on
 * failure or returns the cleaned data on success.
 */
abstract class Validator
{
    protected array $errors = [];

    abstract public function rules(): array;

    public function validate(array $data): array
    {
        $this->errors = [];
        $clean = [];

        foreach ($this->rules() as $field => $rules) {
            $value = $data[$field] ?? null;
            $value = is_string($value) ? trim($value) : $value;

            foreach ($rules as $rule) {
                if (!$this->applyRule($field, $value, $rule, $data)) {
                    break;
                }
            }

            $clean[$field] = $value;
        }

        if ($this->errors) {
            throw new ValidationException($this->errors);
        }

        return $clean;
    }

    private function applyRule(string $field, $value, string $rule, array $data): bool
    {
        [$name, $param] = array_pad(explode(':', $rule, 2), 2, null);

        switch ($name) {
            case 'required':
                if ($value === null || $value === '') {
                    $this->fail($field, 'هذا الحقل مطلوب');
                    return false;
                }
                break;
            case 'string':
                if ($value !== null && !is_string($value)) {
                    $this->fail($field, 'يجب أن يكون نصًا');
                    return false;
                }
                break;
            case 'min':
                if ($value !== null && mb_strlen((string) $value) < (int) $param) {
                    $this->fail($field, "يجب ألا يقل عن {$param} أحرف");
                    return false;
                }
                break;
            case 'max':
                if ($value !== null && mb_strlen((string) $value) > (int) $param) {
                    $this->fail($field, "يجب ألا يزيد عن {$param} حرفًا");
                    return false;
                }
                break;
            case 'phone':
                if ($value !== null && $value !== '' && !preg_match('/^01[0-9]{9}$/', (string) $value)) {
                    $this->fail($field, 'رقم الهاتف غير صحيح');
                    return false;
                }
                break;
            case 'different':
                if ($value !== null && $value === ($data[$param] ?? null)) {
                    $this->fail($field, 'يجب أن يكون مختلفًا');
                    return false;
                }
                break;
            case 'in':
                $options = explode(',', (string) $param);
                if ($value !== null && $value !== '' && !in_array($value, $options, true)) {
                    $this->fail($field, 'قيمة غير صحيحة');
                    return false;
                }
                break;
        }

        return true;
    }

    protected function fail(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }
}
