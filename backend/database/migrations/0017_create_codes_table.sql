-- Phase 6: activation codes, needed for StudentCourses.tsx (activate-code)
-- and the teacher CodeManager/CodeDetails pages to function.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    used_by INT UNSIGNED NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_codes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_codes_used_by FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uniq_code (code),
    INDEX idx_codes_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
