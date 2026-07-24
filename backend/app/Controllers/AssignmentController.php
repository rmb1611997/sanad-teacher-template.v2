<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Models\Assignment;
use App\Repositories\AssignmentRepository;
use App\Repositories\CourseRepository;
use App\Services\AssignmentService;
use App\Services\CourseAccessService;
use App\Services\PermissionService;
use App\Validators\CreateAssignmentValidator;

class AssignmentController extends BaseController
{
    private AssignmentRepository $assignments;
    private CourseRepository $courses;

    public function __construct()
    {
        $this->assignments = new AssignmentRepository();
        $this->courses = new CourseRepository();
    }

    private function findOrFail(int $id): Assignment
    {
        $assignment = $this->assignments->find($id);
        if (!$assignment) {
            throw new ApiException('not_found', 'الواجب غير موجود', 404);
        }
        return $assignment;
    }

    // GET /teacher/assignments — sanad_is_teacher only
    public function index(Request $request): void
    {
        Auth::requireTeacherArea($request);
        $courseId = isset($request->query['courseId']) ? (int) $request->query['courseId'] : null;
        $this->json(array_map(fn ($a) => $a->toArray(), $this->assignments->all($courseId)));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['assignments']);
        $data = (new CreateAssignmentValidator())->validate($request->all());
        $assignment = $this->assignments->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'assignment' => $assignment->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['assignments']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->assignments->update($id, $request->all());
        $this->json(['success' => true, 'assignment' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['assignments']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->assignments->delete($id);
        $this->json(['success' => true]);
    }

    // GET /assignments/{id} — student, course-access gated. Plain assignment shape, no isSubmitted flag (matches original).
    public function show(Request $request): void
    {
        $assignment = $this->findOrFail((int) $request->params['id']);
        $user = Auth::requireStudent($request);
        $course = $this->courses->find($assignment->get('course_id'));

        if (!$course || !CourseAccessService::canAccess($course, $user)) {
            throw new ApiException('forbidden', 'يجب الاشتراك في الكورس للوصول إلى هذا الواجب', 403);
        }

        $this->json($assignment->toArray());
    }

    // POST /assignments/{id}/submit — student, course-access gated, no allow-flag/deadline enforcement (matches original)
    public function submit(Request $request): void
    {
        $assignment = $this->findOrFail((int) $request->params['id']);
        $user = Auth::requireStudent($request);
        $course = $this->courses->find($assignment->get('course_id'));

        if (!$course || !CourseAccessService::canAccess($course, $user)) {
            throw new ApiException('forbidden', 'يجب الاشتراك في الكورس لتسليم هذا الواجب', 403);
        }

        $textAnswer = $request->input('textAnswer');
        $fileUrl = $request->input('fileUrl');
        $imageUrl = $request->input('imageUrl');

        $result = (new AssignmentService())->submit($assignment, $user->id(), $textAnswer, $fileUrl, $imageUrl);
        $this->json($result);
    }
}
