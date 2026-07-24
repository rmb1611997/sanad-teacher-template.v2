<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Assignment;
use App\Repositories\SubmissionRepository;

/**
 * Port of sanad_submit_assignment(). Faithfully replicates two real quirks
 * confirmed in the original: allowText/allowFile/allowImage are NEVER
 * enforced server-side (any non-empty combination is accepted), and
 * hasDeadline/dueDate are NEVER checked (late submissions are allowed).
 */
class AssignmentService
{
    private SubmissionRepository $submissions;

    public function __construct()
    {
        $this->submissions = new SubmissionRepository();
    }

    public function submit(Assignment $assignment, int $studentId, ?string $textAnswer, ?string $fileUrl, ?string $imageUrl): array
    {
        if (!$textAnswer && !$fileUrl && !$imageUrl) {
            throw new ApiException('empty_submission', 'يجب إرسال إجابة أو ملف أو صورة', 400);
        }

        $this->submissions->submit($studentId, $assignment->id(), $textAnswer, $fileUrl, $imageUrl);

        return ['success' => true, 'message' => 'تم إرسال الواجب بنجاح'];
    }
}
