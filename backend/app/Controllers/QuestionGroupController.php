<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Repositories\QuestionGroupRepository;
use App\Services\PermissionService;
use App\Validators\CreateQuestionGroupValidator;

class QuestionGroupController extends BaseController
{
    private QuestionGroupRepository $groups;

    public function __construct()
    {
        $this->groups = new QuestionGroupRepository();
    }

    private function findOrFail(int $id): \App\Models\QuestionGroup
    {
        $group = $this->groups->find($id);
        if (!$group) {
            throw new ApiException('not_found', 'المجموعة غير موجودة', 404);
        }
        return $group;
    }

    // GET /teacher/question-groups — sanad_is_teacher only
    public function index(Request $request): void
    {
        Auth::requireTeacherArea($request);
        $this->json(array_map(fn ($g) => $g->toArray(), $this->groups->all()));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['question-groups']);
        $data = (new CreateQuestionGroupValidator())->validate($request->all());
        $group = $this->groups->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'group' => $group->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['question-groups']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->groups->update($id, $request->all());
        $this->json(['success' => true, 'group' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['question-groups']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->groups->delete($id);
        $this->json(['success' => true]);
    }
}
