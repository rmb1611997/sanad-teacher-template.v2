<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Helpers\Password;
use App\Middleware\Auth;
use App\Repositories\StaffRepository;
use App\Support\PermissionKeys;
use App\Validators\CreateStaffValidator;
use App\Validators\UpdateStaffValidator;

/**
 * Port of the WP plugin's STAFF FUNCTIONS section
 * (sanad_teacher_get_staff / create_staff / update_staff / delete_staff).
 * Every route here is owner-teacher-only (Auth::requireOwnerTeacher),
 * exactly like the original's bare 'sanad_is_owner_teacher' permission_callback.
 */
class StaffController extends BaseController
{
    private StaffRepository $staff;

    public function __construct()
    {
        $this->staff = new StaffRepository();
    }

    public function index(Request $request): void
    {
        Auth::requireOwnerTeacher($request);

        $staff = array_map(fn ($s) => $s->toArray(), $this->staff->all());
        $this->json($staff);
    }

    public function store(Request $request): void
    {
        Auth::requireOwnerTeacher($request);

        $data = (new CreateStaffValidator())->validate($request->all());
        $permissions = PermissionKeys::sanitize((array) $request->input('permissions', []));

        if ($this->staff->phoneExists($data['phone'])) {
            throw new ApiException('phone_exists', 'رقم الهاتف مستخدم بالفعل', 409);
        }

        $staff = $this->staff->create($data['phone'], Password::hash($data['password']), $data['name'], $permissions);

        $this->json(['success' => true, 'staff' => $staff->toArray()], 201);
    }

    public function update(Request $request): void
    {
        Auth::requireOwnerTeacher($request);

        $id = (int) $request->params['id'];
        $existing = $this->staff->find($id);
        if (!$existing) {
            throw new ApiException('not_found', 'الموظف غير موجود', 404);
        }

        $data = (new UpdateStaffValidator())->validate($request->all());

        $fields = [];
        if ($request->input('name') !== null && $data['name'] !== '') {
            $fields['full_name'] = $data['name'];
        }
        if (!empty($request->input('password'))) {
            $fields['password_hash'] = Password::hash($data['password']);
        }
        if ($request->input('permissions') !== null) {
            $fields['permissions'] = json_encode(PermissionKeys::sanitize((array) $request->input('permissions')));
        }

        $this->staff->update($id, $fields);

        $this->json(['success' => true, 'staff' => $this->staff->find($id)->toArray()]);
    }

    public function destroy(Request $request): void
    {
        Auth::requireOwnerTeacher($request);

        $id = (int) $request->params['id'];
        $existing = $this->staff->find($id);
        if (!$existing) {
            throw new ApiException('not_found', 'الموظف غير موجود', 404);
        }

        $this->staff->delete($id);

        $this->json(['success' => true, 'message' => 'تم حذف الموظف']);
    }
}
