<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Repositories\AssignmentRepository;
use App\Repositories\ExamRepository;
use App\Repositories\VideoRepository;
use App\Services\PermissionService;

/**
 * Port of sanad_teacher_reorder_content(). The original's type map is
 * ['video'=>'sanad_video','exam'=>'sanad_exam','assignment'=>'sanad_assignment']
 * — links/notes are deliberately excluded there too (a real limitation in
 * the original itself, replicated here, not a gap introduced by this port).
 * menu_order is set to each item's 0-based INDEX IN THE SUBMITTED LIST
 * (shared across all three types, not a separate counter per type) —
 * matching the original's `foreach ($items as $index => $item) { ...
 * menu_order = $index }`. Unknown types and id/type mismatches are skipped
 * silently, matching the original's `continue`-on-mismatch behavior.
 */
class ContentController extends BaseController
{
    public function reorder(Request $request): void
    {
        PermissionService::require($request, ['course-content']);

        $items = $request->input('items');
        if (!is_array($items) || !$items) {
            throw new ApiException('missing_items', 'العناصر مطلوبة', 400);
        }

        $repos = [
            'video'      => new VideoRepository(),
            'exam'       => new ExamRepository(),
            'assignment' => new AssignmentRepository(),
        ];

        foreach (array_values($items) as $index => $item) {
            $id = isset($item['id']) ? (int) $item['id'] : 0;
            $type = (string) ($item['type'] ?? '');

            if (!$id || !isset($repos[$type])) {
                continue; // unknown/unsupported type — skip silently
            }

            $repo = $repos[$type];
            if (!$repo->exists($id)) {
                continue; // id/type mismatch — skip silently, matching the original
            }

            $repo->setMenuOrder($id, $index);
        }

        $this->json(['success' => true]);
    }
}
