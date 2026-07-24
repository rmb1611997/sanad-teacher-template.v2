-- Phase 1: users table only. Later phases add courses/groups/videos/etc.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    parent_phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('teacher','student','staff') NOT NULL DEFAULT 'student',
    governorate VARCHAR(100) NULL,
    gender VARCHAR(20) NULL,
    grade VARCHAR(50) NULL,
    education_type VARCHAR(50) NULL,
    student_code VARCHAR(10) NULL,
    permissions JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT uq_users_student_code UNIQUE (student_code),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
