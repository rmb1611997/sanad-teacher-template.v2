-- Minimal enrollment table, added in Phase 5 because the dashboard/reports
-- math (studentsPerCourse, subscriptionsOverTime, per-student course-scoped
-- video/exam totals, isEnrolled) has a hard dependency on knowing which
-- students are enrolled in which courses — this was flagged as a documented
-- "not built yet" limitation in Phase 3's CourseContentService and Phase 4's
-- CourseAccessService docblocks, both of which said non-owner users are
-- conservatively treated as not-enrolled "until that table exists." This is
-- the minimal completion of that TODO — NOT the full activation-codes/
-- enrollment-management system (generate-codes/activate-code endpoints
-- remain out of scope; that's a distinct future phase). No business logic
-- in Phase 3/4 was rewritten — CourseAccessService/CourseContentService now
-- query this table instead of hardcoding `false`, which is a completion of
-- their own documented pending work, not a behavior change to anything that
-- was already tested working.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS enrollments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    is_banned TINYINT(1) NOT NULL DEFAULT 0,
    enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_student_course (student_id, course_id),
    INDEX idx_enrollments_course (course_id),
    INDEX idx_enrollments_enrolled_at (enrolled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
