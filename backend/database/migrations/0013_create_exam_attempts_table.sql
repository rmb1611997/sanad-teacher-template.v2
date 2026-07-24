-- Deliberately NO unique key on (student_id, exam_id) — the original allows
-- multiple attempt rows per student per exam (capped app-side by
-- max_attempts, 0 = unlimited), unlike submissions/video_progress which are
-- one-row-per-student upserts.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS exam_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    exam_id INT UNSIGNED NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    answers JSON NULL,
    started_at DATETIME NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exam_attempts_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_attempts_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    INDEX idx_exam_attempts_student (student_id),
    INDEX idx_exam_attempts_exam (exam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
