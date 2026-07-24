<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Repositories\GroupRepository;
use App\Services\PermissionService;
use App\Validators\CreateGroupValidator;

class GroupController extends BaseController
{
    private GroupRepository $groups;

    public function __construct()
    {
        $this->groups = new GroupRepository();
    }

    private function findOrFail(int $id): \App\Models\Group
    {
        $group = $this->groups->find($id);
        if (!$group) {
            throw new ApiException('not_found', 'المجموعة غير موجودة', 404);
        }
        return $group;
    }

    // GET /teacher/groups — sanad_is_teacher only, no permission-key gate
    public function index(Request $request): void
    {
        Auth::requireTeacherArea($request);
        $this->json(array_map(fn ($g) => $g->toArray(), $this->groups->all()));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['groups']);
        $data = (new CreateGroupValidator())->validate($request->all());
        $group = $this->groups->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'group' => $group->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['groups']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->groups->update($id, $request->all());
        $this->json(['success' => true, 'group' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['groups']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->groups->delete($id);
        $this->json(['success' => true]);
    }

    // POST /teacher/groups/reorder — permission 'course-content'
    public function reorder(Request $request): void
    {
        PermissionService::require($request, ['course-content']);
        $groupIds = $request->input('groupIds');
        if (!is_array($groupIds) || !$groupIds) {
            throw new ApiException('missing_group_ids', 'قائمة المجموعات مطلوبة', 400);
        }
        $this->groups->reorder($groupIds);
        $this->json(['success' => true]);
    }
}
