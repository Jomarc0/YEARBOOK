<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    // ── GET /api/admin/users ───────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with(['section', 'batchRecord']);

        // Search by name, email, or student_id
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($role = $request->get('role')) {
            $query->where('role', $role);
        }

        // Filter by status
        if ($status = $request->get('status')) {
            match ($status) {
                'verified'   => $query->where('email_verified', true)->whereNull('suspended_at'),
                'unverified' => $query->where('email_verified', false)->whereNull('suspended_at'),
                'suspended'  => $query->whereNotNull('suspended_at'),
                default      => null,
            };
        }

        $users = $query
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    // ── GET /api/admin/users/{id} ──────────────────────────────────────────────
    public function show(User $user): JsonResponse
    {
        $user->load(['section', 'batchRecord', 'consents', 'subscriptions', 'achievements']);

        return response()->json([
            'data' => array_merge($user->toArray(), [
                'is_premium'    => $user->is_premium,
                'is_sso'        => $user->isSsoUser(),
                'active_sub'    => $user->activeSubscription(),
            ]),
        ]);
    }

    // ── PATCH /api/admin/users/{id} ────────────────────────────────────────────
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role'               => ['sometimes', Rule::in(['student', 'faculty', 'admin'])],
            'profile_visibility' => ['sometimes', Rule::in(['public', 'alumni_only', 'private'])],
            'first_name'         => 'sometimes|string|max:100',
            'last_name'          => 'sometimes|string|max:100',
            'bio'                => 'sometimes|nullable|string|max:500',
            'motto'              => 'sometimes|nullable|string|max:255',
            'course'             => 'sometimes|nullable|string|max:255',
            'batch'              => 'sometimes|nullable|string|max:50',
            'graduation_year'    => 'sometimes|nullable|integer|min:2000|max:2100',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully.',
            'data'    => $user->fresh(),
        ]);
    }

    // ── PATCH /api/admin/users/{id}/suspend ────────────────────────────────────
    public function suspend(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot suspend an admin account.'], 403);
        }

        $user->update(['suspended_at' => now()]);

        // Revoke all tokens so active sessions are terminated immediately
        $user->tokens()->delete();

        return response()->json(['message' => 'User suspended and sessions revoked.']);
    }

    // ── PATCH /api/admin/users/{id}/unsuspend ──────────────────────────────────
    public function unsuspend(User $user): JsonResponse
    {
        $user->update(['suspended_at' => null]);

        return response()->json(['message' => 'User unsuspended.']);
    }

    // ── PATCH /api/admin/users/{id}/verify ────────────────────────────────────
    public function verify(User $user): JsonResponse
    {
        $user->update([
            'email_verified'    => true,
            'email_verified_at' => now(),
        ]);

        return response()->json(['message' => 'User verified as alumni.']);
    }

    // ── POST /api/admin/users/{id}/reset-password ──────────────────────────────
    public function resetPassword(User $user): JsonResponse
    {
        // Uses Laravel's built-in password reset broker (sends email)
        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Password reset email sent to ' . $user->email]);
        }

        return response()->json(['message' => 'Failed to send reset email.'], 422);
    }

    // ── DELETE /api/admin/users/{id} ───────────────────────────────────────────
    public function destroy(User $user): JsonResponse
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot delete an admin account.'], 403);
        }

        // Revoke all tokens before deletion
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}