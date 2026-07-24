<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Exam;
use App\Models\User;
use App\Repositories\CourseRepository;
use App\Repositories\ExamAttemptRepository;
use App\Repositories\QuestionRepository;

/**
 * Port of sanad_get_exam() / sanad_submit_exam(). Business logic only —
 * course-access/404 checks are the caller's (ExamController's) job via
 * CourseAccessService, matching the original's own separation.
 */
class ExamService
{
    private QuestionRepository $questions;
    private ExamAttemptRepository $attempts;
    private CourseRepository $courses;

    public function __construct()
    {
        $this->questions = new QuestionRepository();
        $this->attempts = new ExamAttemptRepository();
        $this->courses = new CourseRepository();
    }

    /** GET /exams/{id} payload — questions WITHOUT correctAnswer, optionally shuffled. */
    public function buildViewPayload(Exam $exam): array
    {
        $questions = $exam->questionGroupId() ? $this->questions->forQuestionGroup($exam->questionGroupId()) : [];

        if ((bool) $exam->get('shuffle_questions')) {
            shuffle($questions);
        }

        $count = count($questions);
        $perQuestionScore = ($exam->totalScore() > 0 && $count > 0)
            ? round($exam->totalScore() / $count, 2)
            : 0;

        return [
            'id'               => $exam->id(),
            'title'            => $exam->get('title'),
            'duration'         => (int) $exam->get('duration', 30),
            'maxAttempts'      => $exam->maxAttempts(),
            'showResult'       => $exam->showResult(),
            'passingScore'     => $exam->passingScore(),
            'totalScore'       => $exam->totalScore(),
            'perQuestionScore' => $perQuestionScore,
            'questions'        => array_map(fn ($q) => $q->toStudentArray(), $questions),
        ];
    }

    /** POST /exams/{id}/submit — scores, records the attempt, returns the result payload. */
    public function submit(Exam $exam, int $studentId, array $answers, ?string $startedAt): array
    {
        if ($exam->maxAttempts() > 0) {
            $used = $this->attempts->countForStudent($studentId, $exam->id());
            if ($used >= $exam->maxAttempts()) {
                throw new ApiException('max_attempts_reached', 'لقد استنفدت عدد المحاولات المسموح بها لهذا الاختبار', 403);
            }
        }

        $questions = $exam->questionGroupId() ? $this->questions->forQuestionGroup($exam->questionGroupId()) : [];
        $count = count($questions);
        $correctCount = 0;
        $review = [];

        foreach ($questions as $question) {
            $correct = (string) $question->correctAnswer();
            $chosen = array_key_exists((string) $question->id(), $answers) ? (string) $answers[$question->id()] : null;
            $isCorrect = $chosen !== null && $chosen === $correct;
            if ($isCorrect) {
                $correctCount++;
            }

            if ($exam->showResult()) {
                $review[] = array_merge($question->toStudentArray(), [
                    'chosenAnswer'  => $chosen,
                    'correctAnswer' => $correct,
                    'isCorrect'     => $isCorrect,
                ]);
            }
        }

        $score = $count > 0 ? (int) round(($correctCount / $count) * $exam->totalScore()) : 0;
        $passed = $score >= $exam->passingScore();

        $this->attempts->record($studentId, $exam->id(), $score, $count, $answers, $startedAt);

        return [
            'success'       => true,
            'score'         => $score,
            'totalScore'    => $exam->totalScore(),
            'passingScore'  => $exam->passingScore(),
            'passed'        => $passed,
            'correctCount'  => $correctCount,
            'totalQuestions' => $count,
            'percent'       => $exam->totalScore() > 0 ? (int) round(($score / $exam->totalScore()) * 100) : 0,
            'showResult'    => $exam->showResult(),
            'review'        => $exam->showResult() ? $review : [],
        ];
    }
}
