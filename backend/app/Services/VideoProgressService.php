<?php

namespace App\Services;

use App\Repositories\VideoProgressRepository;

/**
 * Port of sanad_update_video_progress(). Completion is entirely
 * server-decided from the submitted percentage (>=90 => completed) — the
 * client never sends an isCompleted flag. The upsert is an unconditional
 * overwrite (see VideoProgressRepository docblock) — no "furthest progress
 * wins" logic exists in the original, so this doesn't add any either.
 */
class VideoProgressService
{
    private const COMPLETION_THRESHOLD = 90;

    private VideoProgressRepository $progress;

    public function __construct()
    {
        $this->progress = new VideoProgressRepository();
    }

    public function update(int $studentId, int $videoId, int $watchPercent): array
    {
        $watchPercent = max(0, $watchPercent);
        $isCompleted = $watchPercent >= self::COMPLETION_THRESHOLD;

        $this->progress->upsert($studentId, $videoId, $watchPercent, $isCompleted);

        return ['success' => true, 'isCompleted' => $isCompleted];
    }
}
