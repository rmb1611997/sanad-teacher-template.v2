-- Phase 3: groups (study sections within a course).
-- NOTE ordering quirk preserved from the original: menu_order is a single
-- GLOBAL sequence across every course's groups, not scoped per-course
-- (sanad_teacher_create_group computed MAX(menu_order) with no course
-- filter) — replicated intentionally in GroupRepository::nextMenuOrder().
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `groups` (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    has_schedule TINYINT(1) NOT NULL DEFAULT 0,
    show_from DATETIME NULL,
    hide_to DATETIME NULL,
    menu_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_groups_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_groups_course (course_id),
    INDEX idx_groups_menu_order (menu_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
