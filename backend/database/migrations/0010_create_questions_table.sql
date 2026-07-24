-- correct_answer is an INTEGER INDEX into `choices` (not the answer text) —
-- matches the original's absint(correct_answer) meta storage.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_group_id INT UNSIGNED NOT NULL,
    text TEXT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    image VARCHAR(500) NULL,
    choices JSON NOT NULL,
    correct_answer INT UNSIGNED NOT NULL DEFAULT 0,
    label_style VARCHAR(20) NOT NULL DEFAULT 'ar',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_questions_group FOREIGN KEY (question_group_id) REFERENCES question_groups(id) ON DELETE CASCADE,
    INDEX idx_questions_group (question_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
