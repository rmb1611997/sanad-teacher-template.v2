<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;
use App\Repositories\VideoRepository;
use App\Services\VideoProgressService;

class VideoProgressController extends BaseController
{
    // POST /videos/{id}/progress — student only; completion is server-decided (>=90%)
    public function update(Request $request): void
    {
        $user = Auth::requireStudent($request);
        $videoId = (int) $request->params['id'];

        if (!(new VideoRepository())->find($videoId)) {
            throw new ApiException('not_found', 'الفيديو غير موجود', 404);
        }

        $watchPercent = (int) max(0, (int) $request->input('watchPercent', 0));
        $result = (new VideoProgressService())->update($user->id(), $videoId, $watchPercent);
        $this->json($result);
    }
}
