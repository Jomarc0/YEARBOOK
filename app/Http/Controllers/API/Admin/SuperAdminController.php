<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\Admin;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    use AuditsAdminActions;

    // GET /api/admin/admins
    public function index(Request $request): JsonResponse
    {
        $admins = Admin::with('creator:id,name,username')
            ->when($request->role,   fn ($q) => $q->where('role', $request->role))
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name',     'like', "%{$request->search}%")
                  ->orWhere('username', 'like', "%{$request->search}%");
            }))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => $this->resource($a));

        return response()->json(['data' => $admins]);
    }

    // POST /api/admin/admins
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'username' => 'required|string|max:50|unique:admins,username',
            'password' => 'required|string|min:8|confirmed',
            'role'     => ['required', Rule::in([Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])],
        ]);

        $admin = Admin::create([
            'name'       => $data['name'],
            'username'   => $data['username'],
            'password'   => Hash::make($data['password']),
            'role'       => $data['role'],
            'is_active'  => true,
            'created_by' => $request->user()->id,
        ]);

        $this->audit(
            AuditLog::ACTION_USER_CREATED,
            "Super admin created new {$admin->role} account: '{$admin->username}' (ID #{$admin->id}).",
            AuditLog::STATUS_SUCCESS,
            null,
            $admin->id,
            "admin#{$admin->id}",
        );

        return response()->json([
            'message' => 'Admin account created.',
            'data'    => $this->resource($admin),
        ], 201);
    }

    // PUT /api/admin/admins/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $admin = Admin::findOrFail($id);

        if ($admin->id === $request->user()->id && $request->role === Admin::ROLE_ADMIN) {
            return response()->json(['message' => 'You cannot demote your own account.'], 422);
        }

        $data = $request->validate([
            'name'     => 'sometimes|string|max:100',
            'username' => ['sometimes', 'string', 'max:50', Rule::unique('admins')->ignore($id)],
            'password' => 'sometimes|nullable|string|min:8|confirmed',
            'role'     => ['sometimes', Rule::in([Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])],
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $admin->update($data);

        $this->audit(
            AuditLog::ACTION_USER_UPDATED,
            "Updated admin account '{$admin->username}' (ID #{$admin->id}). Fields: " . implode(', ', array_keys($data)),
            AuditLog::STATUS_SUCCESS,
            null,
            $admin->id,
            "admin#{$admin->id}",
        );

        return response()->json([
            'message' => 'Admin updated.',
            'data'    => $this->resource($admin->fresh()),
        ]);
    }

    // DELETE /api/admin/admins/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $admin    = Admin::findOrFail($id);
        $snapshot = "{$admin->username} (ID #{$admin->id}, role: {$admin->role})";

        $admin->tokens()->delete();
        $admin->delete();

        $this->audit(
            AuditLog::ACTION_USER_DELETED,
            "Deleted admin account {$snapshot}. All tokens revoked.",
            AuditLog::STATUS_WARNING,
            null,
            $id,
            "admin#{$id}",
        );

        return response()->json(['message' => 'Admin account deleted.']);
    }

    // PATCH /api/admin/admins/{id}/toggle-status
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        if ($id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $admin = Admin::findOrFail($id);
        $admin->update(['is_active' => ! $admin->is_active]);

        if (! $admin->is_active) {
            $admin->tokens()->delete();
        }

        $label = $admin->is_active ? 'activated' : 'deactivated';

        $this->audit(
            AuditLog::ACTION_USER_UPDATED,
            "Admin account '{$admin->username}' (ID #{$admin->id}) was {$label}." . (! $admin->is_active ? ' All tokens revoked.' : ''),
            $admin->is_active ? AuditLog::STATUS_SUCCESS : AuditLog::STATUS_WARNING,
            null,
            $admin->id,
            "admin#{$admin->id}",
        );

        return response()->json([
            'message'   => "Admin {$label}.",
            'is_active' => $admin->is_active,
        ]);
    }

    private function resource(Admin $admin): array
    {
        return [
            'id'             => $admin->id,
            'name'           => $admin->name,
            'username'       => $admin->username,
            'role'           => $admin->role,
            'is_super_admin' => $admin->isSuperAdmin(),
            'is_active'      => $admin->is_active,
            'created_by'     => $admin->creator?->only(['id', 'name', 'username']),
            'last_login_at'  => $admin->last_login_at?->toISOString(),
            'created_at'     => $admin->created_at->toISOString(),
        ];
    }
}