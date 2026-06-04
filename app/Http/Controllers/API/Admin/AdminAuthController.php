<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AdminAuthController extends Controller
{
    use AuditsAdminActions;

    // POST /api/admin/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $key      = 'admin_login:' . $request->ip();
        $maxTries = (int) PlatformSettings::get('max_login_attempts', 5);

        if (RateLimiter::tooManyAttempts($key, $maxTries)) {
            $seconds = RateLimiter::availableIn($key);

            $this->audit(
                AuditLog::ACTION_LOGIN_FAILED,
                "Too many login attempts for '{$request->username}'. Locked out for {$seconds}s.",
                AuditLog::STATUS_CRITICAL,
            );

            return response()->json([
                'message' => "Too many attempts. Try again in {$seconds} seconds.",
            ], 429);
        }

        $admin = Admin::where('username', $request->username)
                      ->where('is_active', true)
                      ->first();

        if (! $admin || ! Hash::check($request->password, $admin->password)) {
            RateLimiter::hit($key, 300);

            $this->audit(
                AuditLog::ACTION_LOGIN_FAILED,
                "Failed login attempt for username '{$request->username}'.",
                AuditLog::STATUS_FAILED,
            );

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        RateLimiter::clear($key);
        $admin->tokens()->delete();
        $admin->update(['last_login_at' => now()]);
        $token = $admin->createToken('admin-token')->plainTextToken;

        $this->audit(
            AuditLog::ACTION_LOGIN,
            "Admin '{$admin->username}' (role: {$admin->role}) logged in successfully.",
            AuditLog::STATUS_SUCCESS,
        );

        return response()->json([
            'token' => $token,
            'admin' => $this->resource($admin),
        ]);
    }

    // POST /api/admin/logout
    public function logout(Request $request): JsonResponse
    {
        $username = $request->user()->username;

        $this->audit(
            AuditLog::ACTION_LOGOUT,
            "Admin '{$username}' logged out.",
            AuditLog::STATUS_SUCCESS,
        );

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    // GET /api/admin/me
    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->resource($request->user())]);
    }

    private function resource(Admin $admin): array
    {
        return [
            'id'             => $admin->id,
            'name'           => $admin->name,
            'username'       => $admin->username,
            'role'           => $admin->role,
            'is_super_admin' => $admin->isSuperAdmin(),
            'last_login_at'  => $admin->last_login_at?->toISOString(),
        ];
    }
}