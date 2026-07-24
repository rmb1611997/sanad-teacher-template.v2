<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Models\Exam;
use App\Repositories\CourseRepository;
use App\Repositories\ExamRepository;
use App\Services\CourseAccessService;
use App\Services\ExamService;
use App\Services\PermissionService;
use App\Validators\CreateExamValidator;

class ExamController extends BaseController
{
    private ExamRepository $exams;
    private CourseRepository $courses;

    public function __construct()
    {
        $this->exams = new ExamRepository();
        $this->courses = new CourseRepository();
    }

    private function findOrFail(int $id): Exam
    {
        $exam = $this->exams->find($id);
        if (!$exam) {
            throw new ApiException('not_found', 'الاختبار غير موجود', 404);
        }
        return $exam;
    }

    // GET /teacher/exams — sanad_is_teacher only
    public function index(Request $request): void
    {
        Auth::requireTeacherArea($request);
        $courseId = isset($request->query['courseId']) ? (int) $request->query['courseId'] : null;
        $this->json(array_map(fn ($e) => $e->toArray(), $this->exams->all($courseId)));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['exams']);
        $data = (new CreateExamValidator())->validate($request->all());
        $exam = $this->exams->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'exam' => $exam->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['exams']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->exams->update($id, $request->all());
        $this->json(['success' => true, 'exam' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['exams']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->exams->delete($id);
        $this->json(['success' => true]);
    }

    // GET /exams/{id} — student, course-access gated, no correctAnswer leaked
    public function show(Request $request): void
    {
        $exam = $this->findOrFail((int) $request->params['id']);
        $user = Auth::requireStudent($request);
        $course = $this->courses->find($exam->get('course_id'));

        if (!$course || !CourseAccessService::canAccess($course, $user)) {
            throw new ApiException('forbidden', 'يجب الاشتراك في الكورس للوصول إلى هذا الاختبار', 403);
        }

        $this->json((new ExamService())->buildViewPayload($exam));
    }

    // POST /exams/{id}/submit — student, course-access gated, max-attempts gated, scores + records the attempt
    public function submit(Request $request): void
    {
        $exam = $this->findOrFail((int) $request->params['id']);
        $user = Auth::requireStudent($request);
        $course = $this->courses->find($exam->get('course_id'));

        if (!$course || !CourseAccessService::canAccess($course, $user)) {
            throw new ApiException('forbidden', 'يجب الاشتراك في الكورس لتسليم هذا الاختبار', 403);
        }

        $answers = (array) $request->input('answers', []);
        $startedAtRaw = $request->input('startedAt');
        $startedAt = $startedAtRaw ? date('Y-m-d H:i:s', strtotime($startedAtRaw)) : null;

        $result = (new ExamService())->submit($exam, $user->id(), $answers, $startedAt);
        $this->json($result);
    }
}
