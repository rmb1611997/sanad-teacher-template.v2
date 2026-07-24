<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Repositories\CourseRepository;
use App\Repositories\EnrollmentRepository;
use App\Services\PermissionService;

/** Port of sanad_teacher_get_subscriptions() / cancel / ban / unban. */
class SubscriptionController extends BaseController
{
    // GET /teacher/subscriptions — permission 'subscriptions' or 'subscription-control'
    public function index(Request $request): void
    {
        PermissionService::require($request, ['subscriptions', 'subscription-control']);

        $courses = new CourseRepository();
        $rows = (new EnrollmentRepository())->allWithStudents();

        $result = array_map(function ($row) use ($courses) {
            $course = $courses->find((int) $row['course_id']);
            return [
                'id'            => (int) $row['id'],
                'studentId'     => (int) $row['student_id'],
                'studentCode'   => $row['student_code'],
                'studentName'   => $row['full_name'],
                'studentPhone'  => $row['phone'],
                'parentPhone'   => $row['parent_phone'],
                'governorate'   => $row['governorate'],
                'educationType' => $row['education_type'],
                'grade'         => $row['grade'],
                'courseId'      => (int) $row['course_id'],
                'courseTitle'   => $course ? $course->get('title') : '',
                'enrolledAt'    => $row['enrolled_at'],
                'isBanned'      => (bool) $row['is_banned'],
            ];
        }, $rows);

        $this->json($result);
    }

    // POST /teacher/subscriptions/cancel — permission 'subscription-control'
    public function cancel(Request $request): void
    {
        PermissionService::require($request, ['subscription-control']);
        $studentId = (int) $request->input('studentId', 0);
        $courseId = (int) $request->input('courseId', 0);
        (new EnrollmentRepository())->deleteForStudentCourse($studentId, $courseId);
        $this->json(['success' => true, 'message' => 'تم إلغاء الاشتراك']);
    }

    // POST /teacher/subscriptions/ban — permission 'subscription-control'
    public function ban(Request $request): void
    {
        PermissionService::require($request, ['subscription-control']);
        $studentId = (int) $request->input('studentId', 0);
        $courseId = (int) $request->input('courseId', 0);
        (new EnrollmentRepository())->setBanned($studentId, $courseId, true);
        $this->json(['success' => true, 'message' => 'تم حظر الطالب']);
    }

    // POST /teacher/subscriptions/unban — permission 'subscription-control'
    public function unban(Request $request): void
    {
        PermissionService::require($request, ['subscription-control']);
        $studentId = (int) $request->input('studentId', 0);
        $courseId = (int) $request->input('courseId', 0);
        (new EnrollmentRepository())->setBanned($studentId, $courseId, false);
        $this->json(['success' => true, 'message' => 'تم رفع الحظر']);
    }
}
