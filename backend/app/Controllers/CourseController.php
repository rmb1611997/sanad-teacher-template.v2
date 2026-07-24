<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Repositories\CourseRepository;
use App\Services\CourseContentService;
use App\Services\PermissionService;
use App\Validators\CreateCourseValidator;

class CourseController extends BaseController
{
    private CourseRepository $courses;

    public function __construct()
    {
        $this->courses = new CourseRepository();
    }

    private function findOrFail(int $id): \App\Models\Course
    {
        $course = $this->courses->find($id);
        if (!$course) {
            throw new ApiException('not_found', 'الكورس غير موجود', 404);
        }
        return $course;
    }

    // GET /courses — public
    public function index(Request $request): void
    {
        $grade = $request->query['grade'] ?? null;
        $courses = array_map(fn ($c) => $c->toArray(), $this->courses->all($grade));
        $this->json($courses);
    }

    // GET /courses/{id} — public
    public function show(Request $request): void
    {
        $course = $this->findOrFail((int) $request->params['id']);
        $this->json($course->toArray());
    }

    // GET /courses/{id}/groups — public, flat list, orderby created_at ASC
    public function groups(Request $request): void
    {
        $course = $this->findOrFail((int) $request->params['id']);
        $groups = array_map(fn ($g) => $g->toArray(), (new \App\Repositories\GroupRepository())->forCourse($course->id()));
        $this->json($groups);
    }

    // GET /courses/{id}/content — public aggregate (gated by enrollment/free/gate-chain)
    public function content(Request $request): void
    {
        $course = $this->findOrFail((int) $request->params['id']);
        $user = $request->user ? new \App\Models\User($request->user) : null;
        $payload = (new CourseContentService())->build($course, $user);
        $this->json($payload);
    }

    // GET /my-courses — logged in; owner teacher sees all, others see none until Enrollment phase lands
    public function myCourses(Request $request): void
    {
        $user = Auth::requireStudent($request);
        if ($user->isOwnerTeacher()) {
            $this->json(array_map(fn ($c) => $c->toArray(), $this->courses->all()));
            return;
        }

        // Phase 5: completes the enrollment-table TODO documented here since Phase 3.
        $courseIds = (new \App\Repositories\EnrollmentRepository())->courseIdsForStudent($user->id());
        $courses = array_filter(array_map(fn ($id) => $this->courses->find($id), $courseIds));
        $this->json(array_values(array_map(fn ($c) => $c->toArray(), $courses)));
    }

    // GET /teacher/courses — any teacher-area login (no permission-key gate, matches sanad_is_teacher)
    public function teacherIndex(Request $request): void
    {
        Auth::requireTeacherArea($request);
        $this->json(array_map(fn ($c) => $c->toArray(), $this->courses->all()));
    }

    // POST /teacher/courses — permission 'courses'
    public function store(Request $request): void
    {
        PermissionService::require($request, ['courses']);
        $data = (new CreateCourseValidator())->validate($request->all());
        $course = $this->courses->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'course' => $course->toArray()], 201);
    }

    // PUT /teacher/courses/{id} — permission 'courses'
    public function update(Request $request): void
    {
        PermissionService::require($request, ['courses']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->courses->update($id, $request->all());
        $this->json(['success' => true, 'course' => $this->findOrFail($id)->toArray()]);
    }

    // DELETE /teacher/courses/{id} — permission 'courses'
    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['courses']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->courses->delete($id);
        $this->json(['success' => true]);
    }
}
