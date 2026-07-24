-- Phase 3: generic key/value settings store, used for the course-categories
-- list (the original WordPress plugin stores this as a single wp_options
-- row `sanad_course_categories`, a flat array of strings — not a taxonomy,
-- not a CPT; a course's own `category` field is a separate plain string,
-- entirely decoupled from this list).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) NOT NULL PRIMARY KEY,
    `value` JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO settings (`key`, `value`) VALUES ('course_categories', JSON_ARRAY())
ON DUPLICATE KEY UPDATE `key` = `key`;
