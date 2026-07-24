-- UNIQUE(student_id, video_id): unconditional overwrite on every progress
-- ping (INSERT...ON DUPLICATE KEY UPDATE) — matches the original's
-- $wpdb->replace(), which has NO "furthest progress wins" logic; a lower
-- watch_percent submitted later genuinely regresses the stored value and
-- can flip is_completed back to 0.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS video_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    video_id INT UNSIGNED NOT NULL,
    watch_percent INT NOT NULL DEFAULT 0,
    is_completed TINYINT(1) NOT NULL DEFAULT 0,
    last_watched DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_video_progress_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_video_progress_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_student_video (student_id, video_id),
    INDEX idx_video_progress_video (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
