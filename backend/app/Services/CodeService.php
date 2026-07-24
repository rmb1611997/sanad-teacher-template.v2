<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Repositories\CodeRepository;
use App\Repositories\CourseRepository;
use App\Repositories\EnrollmentRepository;

/** Port of sanad_generate_codes() / sanad_activate_code(). */
class CodeService
{
    private CodeRepository $codes;
    private CourseRepository $courses;
    private EnrollmentRepository $enrollments;

    public function __construct()
    {
        $this->codes = new CodeRepository();
        $this->courses = new CourseRepository();
        $this->enrollments = new EnrollmentRepository();
    }

    public function generate(int $courseId, int $count): array
    {
        if (!$courseId || !$count) {
            throw new ApiException('missing_fields', 'بيانات ناقصة', 400);
        }
        if ($count > 500) {
            throw new ApiException('too_many', 'الحد الأقصى 500 كود', 400);
        }
        if (!$this->courses->find($courseId)) {
            throw new ApiException('invalid_course', 'الكورس غير موجود', 404);
        }

        $generated = [];
        for ($i = 0; $i < $count; $i++) {
            $attempts = 0;
            do {
                $code = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
                $attempts++;
            } while ($this->codes->codeExists($code) && $attempts < 10);

            $this->codes->create($code, $courseId);
            $generated[] = ['code' => $code, 'course_id' => $courseId, 'created_at' => date('Y-m-d H:i:s')];
        }

        return ['success' => true, 'count' => count($generated), 'codes' => $generated];
    }

    public function activate(string $code, int $studentId): array
    {
        if (!$code) {
            throw new ApiException('missing_code', 'الكود مطلوب', 400);
        }

        $row = $this->codes->findByCode($code);
        if (!$row) {
            throw new ApiException('invalid_code', 'الكود غير صحيح', 404);
        }
        if ((int) $row['is_used'] === 1) {
            throw new ApiException('code_used', 'هذا الكود مستخدم بالفعل', 409);
        }
        if ($this->enrollments->existsForStudentCourse($studentId, (int) $row['course_id'])) {
            throw new ApiException('already_enrolled', 'أنت مشترك في هذا الكورس بالفعل', 409);
        }

        $this->codes->markUsed((int) $row['id'], $studentId);
        $this->enrollments->create($studentId, (int) $row['course_id'], (int) $row['id']);

        $course = $this->courses->find((int) $row['course_id']);

        return [
            'success'      => true,
            'message'      => 'تم تفعيل الاشتراك بنجاح',
            'course_id'    => (int) $row['course_id'],
            'course_title' => $course ? $course->get('title') : '',
        ];
    }
}
