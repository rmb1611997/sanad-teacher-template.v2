<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Models\User;
use App\Repositories\EnrollmentRepository;
use App\Repositories\UserRepository;
use App\Services\PermissionService;

/** Port of sanad_teacher_get_students() / update / delete. */
class TeacherStudentController extends BaseController
{
    private function format(User $student, EnrollmentRepository $enrollments): array
    {
        return [
            'id'                => $student->id(),
            'fullName'          => $student->get('full_name'),
            'studentPhone'      => $student->get('phone'),
            'parentPhone'       => $student->get('parent_phone'),
            'governorate'       => $student->get('governorate'),
            'gender'            => $student->get('gender'),
            'grade'             => $student->get('grade'),
            'educationType'     => $student->get('education_type'),
            'studentCode'       => $student->get('student_code'),
            'createdAt'         => $student->get('created_at'),
            'subscribedCourses' => $enrollments->allCourseIdsForStudent($student->id()),
        ];
    }

    // GET /teacher/students — permission 'students'
    public function index(Request $request): void
    {
        PermissionService::require($request, ['students']);
        $enrollments = new EnrollmentRepository();
        $students = (new UserRepository())->studentsOrderedByNewest();
        $this->json(array_map(fn ($s) => $this->format($s, $enrollments), $students));
    }

    // PUT /teacher/students/{id} — permission 'edit-student'
    public function update(Request $request): void
    {
        PermissionService::require($request, ['edit-student']);
        $id = (int) $request->params['id'];
        $users = new UserRepository();

        $existing = $users->findStudent($id);
        if (!$existing) {
            throw new ApiException('not_found', 'الطالب غير موجود', 404);
        }

        $data = $request->all();

        // True partial update — only fields actually present in the request body are touched;
        // an omitted field keeps its existing value instead of being blanked.
        $map = [
            'fullName'      => 'full_name',
            'studentPhone'  => 'phone',
            'parentPhone'   => 'parent_phone',
            'governorate'   => 'governorate',
            'gender'        => 'gender',
            'grade'         => 'grade',
            'educationType' => 'education_type',
        ];

        $fields = [];
        foreach ($map as $inputKey => $column) {
            if (array_key_exists($inputKey, $data)) {
                $fields[$column] = (string) $data[$inputKey];
            }
        }

        if (array_key_exists('studentPhone', $data)) {
            $newPhone = (string) $data['studentPhone'];
            if ($newPhone !== $existing->get('phone')) {
                $conflict = $users->findByPhone($newPhone);
                if ($conflict && $conflict->id() !== $id) {
                    throw new ApiException('phone_exists', 'رقم الهاتف مستخدم بالفعل', 409);
                }
            }
        }

        if (!empty($data['password'])) {
            $fields['password_hash'] = \App\Helpers\Password::hash((string) $data['password']);
        }

        $users->updateStudent($id, $fields);

        $this->json(['success' => true, 'student' => $this->format($users->findStudent($id), new EnrollmentRepository())]);
    }

    // DELETE /teacher/students/{id} — permission 'students'
    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['students']);
        $id = (int) $request->params['id'];
        $users = new UserRepository();

        if (!$users->findStudent($id)) {
            throw new ApiException('not_found', 'الطالب غير موجود', 404);
        }
        if ((new EnrollmentRepository())->countForStudent($id) > 0) {
            throw new ApiException('has_subscriptions', 'لا يمكن حذف طالب مشترك في كورس', 409);
        }

        $users->deleteById($id);
        $this->json(['success' => true, 'message' => 'تم حذف الحساب']);
    }
}
