<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Repositories\AnnouncementRepository;
use App\Services\PermissionService;

class AnnouncementController extends BaseController
{
    private AnnouncementRepository $announcements;

    public function __construct()
    {
        $this->announcements = new AnnouncementRepository();
    }

    private function findOrFail(int $id): \App\Models\Announcement
    {
        $a = $this->announcements->find($id);
        if (!$a) {
            throw new ApiException('not_found', 'الإعلان غير موجود', 404);
        }
        return $a;
    }

    // GET /announcements — public, filtered by is_published + date window
    public function index(Request $request): void
    {
        $this->json(array_map(fn ($a) => $a->toArray(), $this->announcements->published()));
    }

    // GET /teacher/announcements — ALL announcements, unfiltered (matches original)
    public function teacherIndex(Request $request): void
    {
        PermissionService::require($request, ['announcements']);
        $this->json(array_map(fn ($a) => $a->toArray(), $this->announcements->all()));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['announcements']);
        $announcement = $this->announcements->create($request->all());
        $this->json(['success' => true, 'announcement' => $announcement->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['announcements']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->announcements->update($id, $request->all());
        $this->json(['success' => true, 'announcement' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['announcements']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->announcements->delete($id);
        $this->json(['success' => true]);
    }
}
