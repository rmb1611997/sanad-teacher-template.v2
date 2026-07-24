<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Services\AssignmentStatsService;
use App\Services\ComprehensiveReportService;
use App\Services\ExamStatsService;
use App\Services\OverviewStatsService;
use App\Services\PermissionService;
use App\Services\VideoStatsService;

class StatsController extends BaseController
{
    // GET /teacher/stats/overview — permission 'reports' (this IS the teacher dashboard's data source)
    public function overview(Request $request): void
    {
        PermissionService::require($request, ['reports']);
        $this->json((new OverviewStatsService())->build());
    }

    // GET /teacher/stats/videos/{id} — permission 'video-stats'
    public function videoStats(Request $request): void
    {
        PermissionService::require($request, ['video-stats']);
        $this->json((new VideoStatsService())->build((int) $request->params['id']));
    }

    // GET /teacher/stats/exams/{id} — permission 'exam-stats'
    public function examStats(Request $request): void
    {
        PermissionService::require($request, ['exam-stats']);
        $this->json((new ExamStatsService())->build((int) $request->params['id']));
    }

    // GET /teacher/stats/assignments/{id} — permission 'exam-stats' (shares the same key, matches original — no separate assignment-stats key)
    public function assignmentStats(Request $request): void
    {
        PermissionService::require($request, ['exam-stats']);
        $this->json((new AssignmentStatsService())->build((int) $request->params['id']));
    }

    // GET /teacher/reports/comprehensive — permission 'comprehensive-reports'
    public function comprehensive(Request $request): void
    {
        PermissionService::require($request, ['comprehensive-reports']);
        $this->json((new ComprehensiveReportService())->build($request->query));
    }
}
