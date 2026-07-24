-- Phase 3: videos. menu_order is scoped per-group and shared with the
-- notes/links "content" sequence (sanad_next_content_order) so mixed
-- content types interleave in a single order per group.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS videos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    group_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    description MEDIUMTEXT NULL,
    url VARCHAR(500) NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'YouTube',
    duration INT UNSIGNED NULL,
    thumbnail VARCHAR(500) NULL,
    is_free TINYINT(1) NOT NULL DEFAULT 0,
    is_gate TINYINT(1) NOT NULL DEFAULT 0,
    has_schedule TINYINT(1) NOT NULL DEFAULT 0,
    show_from DATETIME NULL,
    hide_to DATETIME NULL,
    menu_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_videos_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_videos_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    INDEX idx_videos_course (course_id),
    INDEX idx_videos_group (group_id),
    INDEX idx_videos_menu_order (menu_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
