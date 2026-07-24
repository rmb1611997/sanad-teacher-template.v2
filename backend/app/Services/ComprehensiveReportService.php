<?php

namespace App\Services;

use App\Repositories\UserRepository;

/**
 * Port of sanad_teacher_get_comprehensive_report(). Exact behaviors
 * replicated (verified against live WordPress ground truth):
 * - Pulls ALL role=student users platform-wide (single-tenant, no per-teacher scoping).
 * - topStudents is computed from the course_id-scoped-but-otherwise-UNFILTERED
 *   row set (i.e. before search/grade/range filters, after the course_id
 *   restriction which happens inside row-building) — top 10 by _level desc,
 *   tie-broken by avgExamScorePercent desc, then avgWatchPercent desc, then
 *   lastActivityAt desc (missing dates treated as epoch).
 * - search: case-insensitive substring on name. phone: substring on phone.
 *   grade: exact match. level/watch/examCompletion/examAvg: inclusive min/max
 *   ranges, only applied when the param is present and non-empty.
 * - sort_field defaults to 'level' (mapped internally to _level); unknown
 *   fields fall back to _level. sort_dir defaults to 'desc'; only literal
 *   'asc' (case-insensitive) sorts ascending.
 * - page defaults to 1 (min 1); pageSize defaults to 20, clamped [1,100].
 * - `_level` is stripped from both `rows` and `topStudents` before response.
 */
class ComprehensiveReportService
{
    private const SORT_MAP = ['level' => '_level'];

    public function build(array $params): array
    {
        $courseId = isset($params['course_id']) && $params['course_id'] !== '' ? (int) $params['course_id'] : 0;

        $builder = new StudentReportRowBuilder();
        $rows = [];
        foreach ((new UserRepository())->allStudents() as $student) {
            $row = $builder->build($student, $courseId);
            if ($row !== null) {
                $rows[] = $row;
            }
        }

        // topStudents: from the course_id-scoped set, BEFORE search/grade/range filters.
        $topSource = $rows;
        usort($topSource, [$this, 'compareForTop']);
        $topStudents = array_map([$this, 'strip'], array_slice($topSource, 0, 10));

        $filtered = array_values(array_filter($rows, fn ($row) => $this->matchesFilters($row, $params)));

        $requestedField = (string) ($params['sort_field'] ?? 'level');
        $sortField = self::SORT_MAP[$requestedField] ?? $requestedField; // 'level'->'_level', everything else passes through 1:1
        $sampleRow = $rows[0] ?? null;
        if ($sampleRow === null || !array_key_exists($sortField, $sampleRow)) {
            $sortField = '_level'; // unknown field name falls back to _level
        }
        $ascending = strtolower((string) ($params['sort_dir'] ?? 'desc')) === 'asc';

        usort($filtered, function ($a, $b) use ($sortField, $ascending) {
            $result = $this->compareField($a, $b, $sortField);
            return $ascending ? $result : -$result;
        });

        $page = max(1, (int) ($params['page'] ?? 1));
        $pageSize = min(100, max(1, (int) ($params['page_size'] ?? 20)));
        $total = count($filtered);
        $pageRows = array_slice($filtered, ($page - 1) * $pageSize, $pageSize);

        return [
            'rows'        => array_map([$this, 'strip'], $pageRows),
            'total'       => $total,
            'page'        => $page,
            'pageSize'    => $pageSize,
            'topStudents' => $topStudents,
        ];
    }

    private function strip(array $row): array
    {
        unset($row['_level']);
        return $row;
    }

    private function matchesFilters(array $row, array $params): bool
    {
        if (!empty($params['search']) && mb_stripos((string) $row['name'], (string) $params['search']) === false) {
            return false;
        }
        if (!empty($params['phone']) && stripos((string) $row['phone'], (string) $params['phone']) === false) {
            return false;
        }
        if (isset($params['grade']) && $params['grade'] !== '' && (string) $row['grade'] !== (string) $params['grade']) {
            return false;
        }

        $ranges = [
            'level_min' => ['_level', 'min'], 'level_max' => ['_level', 'max'],
            'watch_min' => ['avgWatchPercent', 'min'], 'watch_max' => ['avgWatchPercent', 'max'],
            'exam_completion_min' => ['examCompletionPercent', 'min'], 'exam_completion_max' => ['examCompletionPercent', 'max'],
            'exam_avg_min' => ['avgExamScorePercent', 'min'], 'exam_avg_max' => ['avgExamScorePercent', 'max'],
        ];
        foreach ($ranges as $param => [$field, $type]) {
            if (!isset($params[$param]) || $params[$param] === '') {
                continue;
            }
            $bound = (float) $params[$param];
            $value = (float) $row[$field];
            if ($type === 'min' && $value < $bound) {
                return false;
            }
            if ($type === 'max' && $value > $bound) {
                return false;
            }
        }

        return true;
    }

    private function compareField(array $a, array $b, string $field): int
    {
        if ($field === 'lastActivityAt') {
            return (($a[$field] ? strtotime($a[$field]) : 0)) <=> (($b[$field] ? strtotime($b[$field]) : 0));
        }
        if (in_array($field, ['name', 'phone'], true)) {
            return strcmp((string) $a[$field], (string) $b[$field]);
        }
        return $a[$field] <=> $b[$field];
    }

    private function compareForTop(array $a, array $b): int
    {
        if ($a['_level'] !== $b['_level']) {
            return $b['_level'] <=> $a['_level'];
        }
        if ($a['avgExamScorePercent'] !== $b['avgExamScorePercent']) {
            return $b['avgExamScorePercent'] <=> $a['avgExamScorePercent'];
        }
        if ($a['avgWatchPercent'] !== $b['avgWatchPercent']) {
            return $b['avgWatchPercent'] <=> $a['avgWatchPercent'];
        }
        $aTime = $a['lastActivityAt'] ? strtotime($a['lastActivityAt']) : strtotime('1970-01-01');
        $bTime = $b['lastActivityAt'] ? strtotime($b['lastActivityAt']) : strtotime('1970-01-01');
        return $bTime <=> $aTime;
    }
}
