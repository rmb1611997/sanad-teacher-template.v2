SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS exams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    group_id INT UNSIGNED NULL,
    question_group_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    duration INT UNSIGNED NOT NULL DEFAULT 30,
    max_attempts INT UNSIGNED NOT NULL DEFAULT 1,
    passing_score INT UNSIGNED NOT NULL DEFAULT 50,
    total_score INT UNSIGNED NOT NULL DEFAULT 100,
    shuffle_questions TINYINT(1) NOT NULL DEFAULT 0,
    show_result TINYINT(1) NOT NULL DEFAULT 1,
    is_gate TINYINT(1) NOT NULL DEFAULT 0,
    has_schedule TINYINT(1) NOT NULL DEFAULT 0,
    show_from DATETIME NULL,
    hide_to DATETIME NULL,
    menu_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exams_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_exams_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    CONSTRAINT fk_exams_question_group FOREIGN KEY (question_group_id) REFERENCES question_groups(id) ON DELETE SET NULL,
    INDEX idx_exams_course (course_id),
    INDEX idx_exams_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
