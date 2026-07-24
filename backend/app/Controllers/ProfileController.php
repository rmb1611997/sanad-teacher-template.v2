<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Middleware\Auth;

/** Port of sanad_get_profile(). */
class ProfileController extends BaseController
{
    public function show(Request $request): void
    {
        $user = Auth::requireStudent($request);

        $this->json([
            'id'            => $user->id(),
            'fullName'      => $user->get('full_name'),
            'studentPhone'  => $user->get('phone'),
            'parentPhone'   => $user->get('parent_phone'),
            'governorate'   => $user->get('governorate'),
            'gender'        => $user->get('gender'),
            'grade'         => $user->get('grade'),
            'educationType' => $user->get('education_type'),
            'studentCode'   => $user->get('student_code'),
            'createdAt'     => $user->get('created_at'),
        ]);
    }
}
