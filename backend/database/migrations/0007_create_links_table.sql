SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    group_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    description MEDIUMTEXT NULL,
    url VARCHAR(500) NULL,
    has_schedule TINYINT(1) NOT NULL DEFAULT 0,
    show_from DATETIME NULL,
    hide_to DATETIME NULL,
    menu_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_links_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_links_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    INDEX idx_links_course (course_id),
    INDEX idx_links_group (group_id),
    INDEX idx_links_menu_order (menu_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
