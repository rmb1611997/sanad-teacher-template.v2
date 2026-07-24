<?php

/**
 * @return callable(\App\Core\Router): void
 */

use App\Controllers\AnnouncementController;
use App\Controllers\AssignmentController;
use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\CodeController;
use App\Controllers\ContentController;
use App\Controllers\CourseController;
use App\Controllers\ExamController;
use App\Controllers\GroupController;
use App\Controllers\LinkController;
use App\Controllers\NoteController;
use App\Controllers\ProfileController;
use App\Controllers\QuestionController;
use App\Controllers\QuestionGroupController;
use App\Controllers\StaffController;
use App\Controllers\StatsController;
use App\Controllers\StudentProgressController;
use App\Controllers\StudentStatsController;
use App\Controllers\SubscriptionController;
use App\Controllers\TeacherStudentController;
use App\Controllers\UploadController;
use App\Controllers\VideoController;
use App\Controllers\VideoProgressController;
use App\Core\Router;

return function (Router $router) {
    // Phase 1 — authentication (unchanged)
    $router->post('/sanad/v1/auth/login', fn ($req) => (new AuthController())->login($req));
    $router->post('/sanad/v1/auth/logout', fn ($req) => (new AuthController())->logout($req));
    $router->get('/sanad/v1/auth/session', fn ($req) => (new AuthController())->session($req));
    $router->post('/sanad/v1/register', fn ($req) => (new AuthController())->register($req));

    // Phase 2 — staff management (owner-teacher only, per the original's sanad_is_owner_teacher gate)
    $router->get('/sanad/v1/teacher/staff', fn ($req) => (new StaffController())->index($req));
    $router->post('/sanad/v1/teacher/staff', fn ($req) => (new StaffController())->store($req));
    $router->put('/sanad/v1/teacher/staff/{id}', fn ($req) => (new StaffController())->update($req));
    $router->delete('/sanad/v1/teacher/staff/{id}', fn ($req) => (new StaffController())->destroy($req));

    // Phase 3 — courses, groups, videos, notes, links, categories, announcements
    $router->get('/sanad/v1/courses', fn ($req) => (new CourseController())->index($req));
    $router->get('/sanad/v1/courses/{id}', fn ($req) => (new CourseController())->show($req));
    $router->get('/sanad/v1/courses/{id}/groups', fn ($req) => (new CourseController())->groups($req));
    $router->get('/sanad/v1/courses/{id}/content', fn ($req) => (new CourseController())->content($req));
    $router->get('/sanad/v1/my-courses', fn ($req) => (new CourseController())->myCourses($req));
    $router->get('/sanad/v1/teacher/courses', fn ($req) => (new CourseController())->teacherIndex($req));
    $router->post('/sanad/v1/teacher/courses', fn ($req) => (new CourseController())->store($req));
    $router->put('/sanad/v1/teacher/courses/{id}', fn ($req) => (new CourseController())->update($req));
    $router->delete('/sanad/v1/teacher/courses/{id}', fn ($req) => (new CourseController())->destroy($req));

    $router->get('/sanad/v1/teacher/groups', fn ($req) => (new GroupController())->index($req));
    $router->post('/sanad/v1/teacher/groups', fn ($req) => (new GroupController())->store($req));
    $router->put('/sanad/v1/teacher/groups/{id}', fn ($req) => (new GroupController())->update($req));
    $router->delete('/sanad/v1/teacher/groups/{id}', fn ($req) => (new GroupController())->destroy($req));
    $router->post('/sanad/v1/teacher/groups/reorder', fn ($req) => (new GroupController())->reorder($req));

    $router->get('/sanad/v1/videos/{id}', fn ($req) => (new VideoController())->show($req));
    $router->get('/sanad/v1/teacher/videos', fn ($req) => (new VideoController())->index($req));
    $router->post('/sanad/v1/teacher/videos', fn ($req) => (new VideoController())->store($req));
    $router->put('/sanad/v1/teacher/videos/{id}', fn ($req) => (new VideoController())->update($req));
    $router->delete('/sanad/v1/teacher/videos/{id}', fn ($req) => (new VideoController())->destroy($req));
    $router->post('/sanad/v1/teacher/videos/reorder', fn ($req) => (new VideoController())->reorder($req));

    $router->get('/sanad/v1/teacher/notes', fn ($req) => (new NoteController())->index($req));
    $router->post('/sanad/v1/teacher/notes', fn ($req) => (new NoteController())->store($req));
    $router->put('/sanad/v1/teacher/notes/{id}', fn ($req) => (new NoteController())->update($req));
    $router->delete('/sanad/v1/teacher/notes/{id}', fn ($req) => (new NoteController())->destroy($req));

    $router->get('/sanad/v1/teacher/links', fn ($req) => (new LinkController())->index($req));
    $router->post('/sanad/v1/teacher/links', fn ($req) => (new LinkController())->store($req));
    $router->put('/sanad/v1/teacher/links/{id}', fn ($req) => (new LinkController())->update($req));
    $router->delete('/sanad/v1/teacher/links/{id}', fn ($req) => (new LinkController())->destroy($req));

    $router->get('/sanad/v1/categories', fn ($req) => (new CategoryController())->index($req));
    $router->post('/sanad/v1/categories', fn ($req) => (new CategoryController())->store($req));

    $router->get('/sanad/v1/announcements', fn ($req) => (new AnnouncementController())->index($req));
    $router->get('/sanad/v1/teacher/announcements', fn ($req) => (new AnnouncementController())->teacherIndex($req));
    $router->post('/sanad/v1/teacher/announcements', fn ($req) => (new AnnouncementController())->store($req));
    $router->put('/sanad/v1/teacher/announcements/{id}', fn ($req) => (new AnnouncementController())->update($req));
    $router->delete('/sanad/v1/teacher/announcements/{id}', fn ($req) => (new AnnouncementController())->destroy($req));

    $router->post('/sanad/v1/teacher/content/reorder', fn ($req) => (new ContentController())->reorder($req));

    // Phase 4 — question groups, questions, exams, assignments, exam attempts, submissions, video progress
    $router->get('/sanad/v1/teacher/question-groups', fn ($req) => (new QuestionGroupController())->index($req));
    $router->post('/sanad/v1/teacher/question-groups', fn ($req) => (new QuestionGroupController())->store($req));
    $router->put('/sanad/v1/teacher/question-groups/{id}', fn ($req) => (new QuestionGroupController())->update($req));
    $router->delete('/sanad/v1/teacher/question-groups/{id}', fn ($req) => (new QuestionGroupController())->destroy($req));

    $router->get('/sanad/v1/teacher/questions', fn ($req) => (new QuestionController())->index($req));
    $router->post('/sanad/v1/teacher/questions', fn ($req) => (new QuestionController())->store($req));
    $router->put('/sanad/v1/teacher/questions/{id}', fn ($req) => (new QuestionController())->update($req));
    $router->delete('/sanad/v1/teacher/questions/{id}', fn ($req) => (new QuestionController())->destroy($req));

    $router->get('/sanad/v1/teacher/exams', fn ($req) => (new ExamController())->index($req));
    $router->post('/sanad/v1/teacher/exams', fn ($req) => (new ExamController())->store($req));
    $router->put('/sanad/v1/teacher/exams/{id}', fn ($req) => (new ExamController())->update($req));
    $router->delete('/sanad/v1/teacher/exams/{id}', fn ($req) => (new ExamController())->destroy($req));
    $router->get('/sanad/v1/exams/{id}', fn ($req) => (new ExamController())->show($req));
    $router->post('/sanad/v1/exams/{id}/submit', fn ($req) => (new ExamController())->submit($req));

    $router->get('/sanad/v1/teacher/assignments', fn ($req) => (new AssignmentController())->index($req));
    $router->post('/sanad/v1/teacher/assignments', fn ($req) => (new AssignmentController())->store($req));
    $router->put('/sanad/v1/teacher/assignments/{id}', fn ($req) => (new AssignmentController())->update($req));
    $router->delete('/sanad/v1/teacher/assignments/{id}', fn ($req) => (new AssignmentController())->destroy($req));
    $router->get('/sanad/v1/assignments/{id}', fn ($req) => (new AssignmentController())->show($req));
    $router->post('/sanad/v1/assignments/{id}/submit', fn ($req) => (new AssignmentController())->submit($req));

    $router->post('/sanad/v1/videos/{id}/progress', fn ($req) => (new VideoProgressController())->update($req));

    // Phase 5 — dashboard, statistics, reports, comprehensive reports (+ top students), student progress
    $router->get('/sanad/v1/teacher/stats/overview', fn ($req) => (new StatsController())->overview($req));
    $router->get('/sanad/v1/teacher/stats/videos/{id}', fn ($req) => (new StatsController())->videoStats($req));
    $router->get('/sanad/v1/teacher/stats/exams/{id}', fn ($req) => (new StatsController())->examStats($req));
    $router->get('/sanad/v1/teacher/stats/assignments/{id}', fn ($req) => (new StatsController())->assignmentStats($req));
    $router->get('/sanad/v1/teacher/reports/comprehensive', fn ($req) => (new StatsController())->comprehensive($req));
    $router->get('/sanad/v1/student/course-progress', fn ($req) => (new StudentProgressController())->index($req));

    // Phase 6 — media upload (WP-core-media-compatible path, since the frontend still calls /wp/v2/media)
    $router->post('/wp/v2/media', fn ($req) => (new UploadController())->store($req));

    // Phase 6 — activation codes, profile, student stats/activity-log, teacher student/subscription management
    // (necessary integration glue so every existing frontend page actually functions)
    $router->post('/sanad/v1/generate-codes', fn ($req) => (new CodeController())->generate($req));
    $router->post('/sanad/v1/activate-code', fn ($req) => (new CodeController())->activate($req));
    $router->get('/sanad/v1/teacher/codes', fn ($req) => (new CodeController())->index($req));
    $router->get('/sanad/v1/teacher/codes/details', fn ($req) => (new CodeController())->details($req));

    $router->get('/sanad/v1/profile', fn ($req) => (new ProfileController())->show($req));
    $router->get('/sanad/v1/student/stats', fn ($req) => (new StudentStatsController())->stats($req));
    $router->get('/sanad/v1/student/activity-log', fn ($req) => (new StudentStatsController())->activityLog($req));

    $router->get('/sanad/v1/teacher/students', fn ($req) => (new TeacherStudentController())->index($req));
    $router->put('/sanad/v1/teacher/students/{id}', fn ($req) => (new TeacherStudentController())->update($req));
    $router->delete('/sanad/v1/teacher/students/{id}', fn ($req) => (new TeacherStudentController())->destroy($req));

    $router->get('/sanad/v1/teacher/subscriptions', fn ($req) => (new SubscriptionController())->index($req));
    $router->post('/sanad/v1/teacher/subscriptions/cancel', fn ($req) => (new SubscriptionController())->cancel($req));
    $router->post('/sanad/v1/teacher/subscriptions/ban', fn ($req) => (new SubscriptionController())->ban($req));
    $router->post('/sanad/v1/teacher/subscriptions/unban', fn ($req) => (new SubscriptionController())->unban($req));
};
