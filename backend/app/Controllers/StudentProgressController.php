<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Middleware\Auth;
use App\Services\StudentCourseProgressService;

class StudentProgressController extends BaseController
{
    // GET /student/course-progress — student only
    public function index(Request $request): void
    {
        $user = Auth::requireStudent($request);
        $this->json((new StudentCourseProgressService())->build($user->id()));
    }
}
