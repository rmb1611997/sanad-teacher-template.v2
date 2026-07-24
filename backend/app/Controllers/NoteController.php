<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Repositories\NoteRepository;
use App\Services\PermissionService;
use App\Validators\CreateNoteValidator;

class NoteController extends BaseController
{
    private NoteRepository $notes;

    public function __construct()
    {
        $this->notes = new NoteRepository();
    }

    private function findOrFail(int $id): \App\Models\Note
    {
        $note = $this->notes->find($id);
        if (!$note) {
            throw new ApiException('not_found', 'المذكرة غير موجودة', 404);
        }
        return $note;
    }

    // GET /teacher/notes — gated by the 'notes' permission key too (unlike courses/groups/videos lists)
    public function index(Request $request): void
    {
        PermissionService::require($request, ['notes']);
        $courseId = isset($request->query['courseId']) ? (int) $request->query['courseId'] : null;
        $groupId = isset($request->query['groupId']) ? (int) $request->query['groupId'] : null;
        $this->json(array_map(fn ($n) => $n->toArray(), $this->notes->all($courseId, $groupId)));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['notes']);
        $data = (new CreateNoteValidator())->validate($request->all());
        $note = $this->notes->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'note' => $note->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['notes']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->notes->update($id, $request->all());
        $this->json(['success' => true, 'note' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['notes']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->notes->delete($id);
        $this->json(['success' => true]); // no `message` key, matches original
    }
}
