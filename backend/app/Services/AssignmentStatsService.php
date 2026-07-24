<?php

namespace App\Services;

use App\Repositories\SubmissionRepository;
use App\Repositories\UserRepository;

/** Port of sanad_teacher_get_assignment_stats(): flat per-student array, no score/grade field. */
class AssignmentStatsService
{
    public function build(int $assignmentId): array
    {
        $submissions = new SubmissionRepository();
        $students = (new UserRepository())->allStudents();

        return array_map(function ($student) use ($submissions, $assignmentId) {
            $row = $submissions->find($student->id(), $assignmentId);
            return [
                'studentId'     => $student->id(),
                'studentCode'   => $student->get('student_code'),
                'studentName'   => $student->get('full_name'),
                'studentPhone'  => $student->get('phone'),
                'parentPhone'   => $student->get('parent_phone'),
                'educationType' => $student->get('education_type'),
                'hasSubmitted'  => $row !== null,
                'submittedAt'   => $row['submitted_at'] ?? null,
            ];
        }, $students);
    }
}
