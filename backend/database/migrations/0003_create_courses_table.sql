-- Phase 3: courses. Single-tenant platform (matches the original — no
-- teacher_id/owner column existed on sanad_course either; the one teacher
-- account implicitly owns everything, enforced in the app layer via
-- Auth::requireOwnerTeacher/PermissionService, not via a DB column).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description MEDIUMTEXT NULL,
    short_description TEXT NULL,
    grade VARCHAR(50) NULL,
    category VARCHAR(150) NULL,
    price INT UNSIGNED NOT NULL DEFAULT 0,
    discount_price INT UNSIGNED NULL,
    is_free TINYINT(1) NOT NULL DEFAULT 0,
    image VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_courses_grade (grade),
    INDEX idx_courses_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
