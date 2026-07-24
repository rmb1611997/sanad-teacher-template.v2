<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Repositories\SettingsRepository;
use App\Services\PermissionService;

class CategoryController extends BaseController
{
    private const SETTING_KEY = 'course_categories';

    private SettingsRepository $settings;

    public function __construct()
    {
        $this->settings = new SettingsRepository();
    }

    // GET /categories — public, response is the BARE array itself (not wrapped)
    public function index(Request $request): void
    {
        $this->json($this->settings->get(self::SETTING_KEY, []));
    }

    // POST /categories — permission 'categories'; full overwrite, not merge
    public function store(Request $request): void
    {
        PermissionService::require($request, ['categories']);
        $categories = array_map('strval', (array) $request->input('categories', []));
        $this->settings->set(self::SETTING_KEY, $categories);
        $this->json(['success' => true, 'categories' => $categories]);
    }
}
