<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use App\Repositories\EnrollmentRepository;
use App\Repositories\GroupRepository;
use App\Repositories\LinkRepository;
use App\Repositories\NoteRepository;
use App\Repositories\VideoRepository;

/**
 * Port of sanad_get_course_content(): builds the grouped
 * { course, isEnrolled, isFree, groups: [{ id, title, description, lessons: [...] }] }
 * payload, merging video/link/note per group into one gate-chain-ordered
 * sequence by menu_order (exam/assignment will join this merge once those
 * tables exist in a later phase — scope of Phase 3 is courses/groups/videos/
 * notes/links/categories/announcements only).
 *
 * Phase 5 note: isEnrolled now queries the real `enrollments` table added in
 * Phase 5 (migration 0016), completing the TODO this docblock previously
 * flagged. Owner teacher still always bypasses (unchanged). Every
 * previously-tested "not enrolled" scenario still resolves to `false` (no
 * enrollment row exists), so no Phase 3 test outcome changes.
 */
class CourseContentService
{
    private GroupRepository $groups;
    private VideoRepository $videos;
    private NoteRepository $notes;
    private LinkRepository $links;
    private EnrollmentRepository $enrollments;

    public function __construct()
    {
        $this->groups = new GroupRepository();
        $this->videos = new VideoRepository();
        $this->notes = new NoteRepository();
        $this->links = new LinkRepository();
        $this->enrollments = new EnrollmentRepository();
    }

    public function build(Course $course, ?User $user): array
    {
        $isOwnerTeacher = $user && $user->isOwnerTeacher();
        $isEnrolled = $isOwnerTeacher || ($user && $this->enrollments->isEnrolled($user->id(), $course->id()));
        $courseIsFree = $course->isFree();

        $groups = [];
        foreach ($this->groups->forCourseOrderedByMenu($course->id()) as $group) {
            $items = $this->mergedItems($group->id());
            $gateCleared = true;
            $lessons = [];

            foreach ($items as $item) {
                [$type, $row] = $item;
                $lessons[] = $this->formatLesson($type, $row, $courseIsFree, $isEnrolled, $gateCleared);

                if ($type === 'video' && !empty($row['is_gate']) && empty($row['is_completed'])) {
                    $gateCleared = false;
                }
            }

            $groups[] = [
                'id'          => $group->id(),
                'title'       => $group->get('title'),
                'description' => $group->get('description'),
                'lessons'     => $lessons,
            ];
        }

        return [
            'course'     => $course->toArray(),
            'isEnrolled' => $isEnrolled,
            'isFree'     => $courseIsFree,
            'groups'     => $groups,
        ];
    }

    /** @return array<int, array{0:string,1:array}> [type, rawRow] tuples merged by menu_order */
    private function mergedItems(int $groupId): array
    {
        $items = [];
        foreach ($this->videos->forGroupOrderedByMenu($groupId) as $v) {
            $items[] = ['video', $v->raw() + ['is_completed' => false]];
        }
        foreach ($this->links->forGroupOrderedByMenu($groupId) as $l) {
            $items[] = ['link', $l->raw()];
        }
        foreach ($this->notes->forGroupOrderedByMenu($groupId) as $n) {
            $items[] = ['note', $n->raw()];
        }

        usort($items, fn ($a, $b) => ($a[1]['menu_order'] ?? 0) <=> ($b[1]['menu_order'] ?? 0));

        return $items;
    }

    private function formatLesson(string $type, array $row, bool $courseIsFree, bool $isEnrolled, bool $gateCleared): array
    {
        if ($type === 'video') {
            $videoIsFree = (bool) $row['is_free'];
            $canAccess = $gateCleared && ($courseIsFree || $isEnrolled || $videoIsFree);

            return [
                'id'          => (int) $row['id'],
                'title'       => $row['title'],
                'type'        => 'video',
                'description' => $row['description'],
                'duration'    => $row['duration'] !== null ? (int) $row['duration'] : null,
                'isFree'      => $videoIsFree,
                'isGate'      => (bool) $row['is_gate'],
                'isLocked'    => !$canAccess,
                'url'         => $canAccess ? $row['url'] : null,
                'provider'    => $row['provider'],
            ];
        }

        // link / note share the same access + schedule-window formula.
        $canAccess = $gateCleared && ($courseIsFree || $isEnrolled);
        $inSchedule = $this->inScheduleWindow($row['show_from'] ?? null, $row['hide_to'] ?? null);
        $isLocked = !$canAccess || !$inSchedule;

        return [
            'id'          => (int) $row['id'],
            'title'       => $row['title'],
            'type'        => $type,
            'description' => $row['description'],
            'url'         => $isLocked ? null : ($type === 'link' ? $row['url'] : $row['file_url']),
            'isGate'      => false,
            'isLocked'    => $isLocked,
        ];
    }

    private function inScheduleWindow(?string $showFrom, ?string $hideTo): bool
    {
        $now = date('Y-m-d H:i:s');
        if ($showFrom && $now < $showFrom) {
            return false;
        }
        if ($hideTo && $now > $hideTo) {
            return false;
        }
        return true;
    }
}
