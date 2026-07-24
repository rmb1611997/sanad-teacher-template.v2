<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Repositories\LinkRepository;
use App\Services\PermissionService;
use App\Validators\CreateLinkValidator;

class LinkController extends BaseController
{
    private LinkRepository $links;

    public function __construct()
    {
        $this->links = new LinkRepository();
    }

    private function findOrFail(int $id): \App\Models\Link
    {
        $link = $this->links->find($id);
        if (!$link) {
            throw new ApiException('not_found', 'الرابط غير موجود', 404);
        }
        return $link;
    }

    public function index(Request $request): void
    {
        PermissionService::require($request, ['links']);
        $courseId = isset($request->query['courseId']) ? (int) $request->query['courseId'] : null;
        $groupId = isset($request->query['groupId']) ? (int) $request->query['groupId'] : null;
        $this->json(array_map(fn ($l) => $l->toArray(), $this->links->all($courseId, $groupId)));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['links']);
        $data = (new CreateLinkValidator())->validate($request->all());
        $link = $this->links->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'link' => $link->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['links']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->links->update($id, $request->all());
        $this->json(['success' => true, 'link' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['links']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->links->delete($id);
        $this->json(['success' => true]);
    }
}
