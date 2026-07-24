SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS assignments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    group_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    description MEDIUMTEXT NULL,
    allow_text TINYINT(1) NOT NULL DEFAULT 1,
    allow_file TINYINT(1) NOT NULL DEFAULT 0,
    allow_image TINYINT(1) NOT NULL DEFAULT 0,
    has_deadline TINYINT(1) NOT NULL DEFAULT 0,
    due_date DATETIME NULL,
    is_gate TINYINT(1) NOT NULL DEFAULT 0,
    has_schedule TINYINT(1) NOT NULL DEFAULT 0,
    show_from DATETIME NULL,
    menu_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    INDEX idx_assignments_course (course_id),
    INDEX idx_assignments_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
