<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Repositories\CodeRepository;
use App\Repositories\CourseRepository;
use App\Repositories\UserRepository;
use App\Services\CodeService;
use App\Services\PermissionService;
use App\Services\RateLimiter;

class CodeController extends BaseController
{
    public function generate(Request $request): void
    {
        $user = PermissionService::require($request, ['codes']);
        if (!RateLimiter::attempt('generate_' . $user->id(), 10, 60)) {
            throw new ApiException('rate_limit', 'محاولات كثيرة — انتظر دقيقة', 429);
        }

        $courseId = (int) $request->input('courseId', 0);
        $count = (int) $request->input('count', 0);
        $this->json((new CodeService())->generate($courseId, $count));
    }

    public function activate(Request $request): void
    {
        $user = Auth::requireStudent($request);
        if (!RateLimiter::attempt('activate_' . $request->clientIp(), 10, 60)) {
            throw new ApiException('rate_limit', 'محاولات كثيرة — انتظر دقيقة', 429);
        }

        $code = trim((string) $request->input('code', ''));
        $this->json((new CodeService())->activate($code, $user->id()));
    }

    // GET /teacher/codes — permission 'codes'
    public function index(Request $request): void
    {
        PermissionService::require($request, ['codes']);

        $codes = new CodeRepository();
        $courses = new CourseRepository();

        $result = array_map(function ($row) use ($courses) {
            $course = $courses->find((int) $row['course_id']);
            return [
                'id'          => (int) $row['id'],
                'code'        => $row['code'],
                'courseId'    => (int) $row['course_id'],
                'courseTitle' => $course ? $course->get('title') : '',
                'isUsed'      => (bool) $row['is_used'],
                'usedBy'      => $row['used_by'] !== null ? (int) $row['used_by'] : null,
                'usedAt'      => $row['used_at'],
                'createdAt'   => $row['created_at'],
            ];
        }, $codes->all());

        $this->json($result);
    }

    // GET /teacher/codes/details?code= — permission 'code-details'
    public function details(Request $request): void
    {
        PermissionService::require($request, ['code-details']);

        $code = (string) ($request->query['code'] ?? '');
        $row = (new CodeRepository())->findByCode($code);
        if (!$row) {
            throw new ApiException('not_found', 'الكود غير موجود', 404);
        }

        $course = (new CourseRepository())->find((int) $row['course_id']);
        $student = null;
        if ($row['used_by']) {
            $user = (new UserRepository())->findById((int) $row['used_by']);
            if ($user) {
                $student = [
                    'fullName'     => $user->get('full_name'),
                    'studentPhone' => $user->get('phone'),
                    'parentPhone'  => $user->get('parent_phone'),
                    'governorate'  => $user->get('governorate'),
                ];
            }
        }

        $this->json([
            'id'          => (int) $row['id'],
            'code'        => $row['code'],
            'courseId'    => (int) $row['course_id'],
            'courseTitle' => $course ? $course->get('title') : '',
            'isUsed'      => (bool) $row['is_used'],
            'usedAt'      => $row['used_at'],
            'createdAt'   => $row['created_at'],
            'student'     => $student,
        ]);
    }
}
