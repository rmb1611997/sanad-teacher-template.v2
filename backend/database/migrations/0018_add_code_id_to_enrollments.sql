-- Additive: link an enrollment back to the activation code that created it (matches the original schema).
SET NAMES utf8mb4;

ALTER TABLE enrollments
    ADD COLUMN code_id INT UNSIGNED NULL AFTER course_id,
    ADD CONSTRAINT fk_enrollments_code FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE SET NULL;
