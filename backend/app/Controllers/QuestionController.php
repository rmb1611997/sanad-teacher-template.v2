<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Repositories\QuestionRepository;
use App\Services\PermissionService;
use App\Validators\CreateQuestionValidator;

class QuestionController extends BaseController
{
    private QuestionRepository $questions;

    public function __construct()
    {
        $this->questions = new QuestionRepository();
    }

    private function findOrFail(int $id): \App\Models\Question
    {
        $question = $this->questions->find($id);
        if (!$question) {
            throw new ApiException('not_found', 'السؤال غير موجود', 404);
        }
        return $question;
    }

    // GET /teacher/questions?groupId= — gated by 'question-bank' (unlike course/group/video lists)
    public function index(Request $request): void
    {
        PermissionService::require($request, ['question-bank']);
        $groupId = isset($request->query['groupId']) && $request->query['groupId'] !== '' ? (int) $request->query['groupId'] : null;
        $this->json(array_map(fn ($q) => $q->toArray(), $this->questions->all($groupId)));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['question-bank']);
        $data = (new CreateQuestionValidator())->validate($request->all());
        $question = $this->questions->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'question' => $question->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['question-bank']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->questions->update($id, $request->all());
        $this->json(['success' => true, 'question' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['question-bank']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->questions->delete($id);
        $this->json(['success' => true]);
    }
}
