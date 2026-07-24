<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Repositories\CourseRepository;
use App\Repositories\GroupRepository;
use App\Repositories\VideoRepository;
use App\Services\PermissionService;
use App\Validators\CreateVideoValidator;

class VideoController extends BaseController
{
    private VideoRepository $videos;

    public function __construct()
    {
        $this->videos = new VideoRepository();
    }

    private function findOrFail(int $id): \App\Models\Video
    {
        $video = $this->videos->find($id);
        if (!$video) {
            throw new ApiException('not_found', 'الفيديو غير موجود', 404);
        }
        return $video;
    }

    // GET /teacher/videos — sanad_is_teacher only
    public function index(Request $request): void
    {
        Auth::requireTeacherArea($request);
        $courseId = isset($request->query['courseId']) ? (int) $request->query['courseId'] : null;
        $groupId = isset($request->query['groupId']) ? (int) $request->query['groupId'] : null;
        $this->json(array_map(fn ($v) => $v->toArray(), $this->videos->all($courseId, $groupId)));
    }

    public function store(Request $request): void
    {
        PermissionService::require($request, ['videos']);
        $data = (new CreateVideoValidator())->validate($request->all());
        $video = $this->videos->create(array_merge($request->all(), $data));
        $this->json(['success' => true, 'video' => $video->toArray()], 201);
    }

    public function update(Request $request): void
    {
        PermissionService::require($request, ['videos']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->videos->update($id, $request->all());
        $this->json(['success' => true, 'video' => $this->findOrFail($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        PermissionService::require($request, ['videos']);
        $id = (int) $request->params['id'];
        $this->findOrFail($id);
        $this->videos->delete($id);
        $this->json(['success' => true]);
    }

    public function reorder(Request $request): void
    {
        PermissionService::require($request, ['course-content']);
        $videoIds = $request->input('videoIds');
        if (!is_array($videoIds) || !$videoIds) {
            throw new ApiException('missing_video_ids', 'قائمة الفيديوهات مطلوبة', 400);
        }
        $this->videos->reorder($videoIds);
        $this->json(['success' => true]);
    }

    // GET /videos/{id} — public, gated single-video page (sanad_get_video shape)
    public function show(Request $request): void
    {
        $video = $this->findOrFail((int) $request->params['id']);
        $course = (new CourseRepository())->find($video->get('course_id'));
        if (!$course) {
            throw new ApiException('not_found', 'الفيديو غير موجود', 404);
        }

        $user = $request->user ? new \App\Models\User($request->user) : null;
        $isOwnerTeacher = $user && $user->isOwnerTeacher();
        $isEnrolled = $isOwnerTeacher || ($user && (new \App\Repositories\EnrollmentRepository())->isEnrolled($user->id(), $course->id()));

        $canAccess = $course->isFree() || $isEnrolled || $video->isFree();

        $groupsPayload = [];
        if ($video->groupId()) {
            $group = (new GroupRepository())->find($video->groupId());
            if ($group) {
                $siblings = $this->videos->all($course->id(), $group->id());
                $groupsPayload[] = [
                    'id'      => $group->id(),
                    'title'   => $group->get('title'),
                    'lessons' => array_map(function ($sibling) use ($course, $isEnrolled) {
                        $siblingCanAccess = $course->isFree() || $isEnrolled || $sibling->isFree();
                        return [
                            'id'          => $sibling->id(),
                            'title'       => $sibling->get('title'),
                            'type'        => 'video',
                            'duration'    => $sibling->get('duration') !== null ? (int) $sibling->get('duration') : null,
                            'isLocked'    => !$siblingCanAccess,
                            'isCompleted' => false, // hardcoded false, matching the original exactly
                        ];
                    }, $siblings),
                ];
            }
        }

        $this->json([
            'id'          => $video->id(),
            'title'       => $video->get('title'),
            'description' => $video->get('description'),
            'provider'    => $video->get('provider'),
            'url'         => $canAccess ? $video->get('url') : null,
            'duration'    => $video->get('duration') !== null ? (int) $video->get('duration') : null,
            'courseTitle' => $course->get('title'),
            'isLocked'    => !$canAccess,
            'groups'      => $groupsPayload,
        ]);
    }
}
