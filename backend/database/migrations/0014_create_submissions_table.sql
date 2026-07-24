-- UNIQUE(student_id, assignment_id): a resubmission overwrites the prior
-- row (INSERT...ON DUPLICATE KEY UPDATE), matching the original's
-- $wpdb->replace() upsert-by-unique-key semantics.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    assignment_id INT UNSIGNED NOT NULL,
    text_answer MEDIUMTEXT NULL,
    file_url VARCHAR(500) NULL,
    image_url VARCHAR(500) NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_student_assignment (student_id, assignment_id),
    INDEX idx_submissions_assignment (assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
