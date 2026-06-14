<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Services\Security\TotpService;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AdminAuthController extends Controller
{
    use AuditsAdminActions;

    public function __construct(private readonly TotpService $totp)
    {
    }

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

        $challenge = Str::random(48);
        $cacheKey = "admin_totp_challenge:{$challenge}";
        $setupRequired = empty($admin->totp_secret);

        $setup = null;
        if ($setupRequired) {
            $secret = $admin->totp_pending_secret ?: $this->totp->generateSecret();
            $admin->forceFill(['totp_pending_secret' => $secret])->save();
            $setup = [
                'issuer' => config('app.name', 'Sinag-Bughaw'),
                'account' => $admin->username,
                'secret' => $secret,
                'otpauth_url' => $this->totp->provisioningUri(
                    config('app.name', 'Sinag-Bughaw'),
                    $admin->username,
                    $secret,
                ),
                'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' . rawurlencode(
                    $this->totp->provisioningUri(config('app.name', 'Sinag-Bughaw'), $admin->username, $secret)
                ),
            ];
        }

        Cache::put($cacheKey, [
            'admin_id' => $admin->id,
            'setup_required' => $setupRequired,
        ], now()->addMinutes(5));

        $this->audit(
            AuditLog::ACTION_LOGIN_FAILED,
            "Admin '{$admin->username}' passed password check and must complete Google Authenticator verification.",
            AuditLog::STATUS_SUCCESS,
        );

        return response()->json([
            'two_factor_required' => true,
            'challenge' => $challenge,
            'setup_required' => $setupRequired,
            'setup' => $setup,
        ]);
    }

    // POST /api/admin/login/totp
    public function verifyTotp(Request $request): JsonResponse
    {
        $request->validate([
            'challenge' => 'required|string',
            'code' => 'required|string',
        ]);

        $challenge = (string) $request->input('challenge');
        $cacheKey = "admin_totp_challenge:{$challenge}";
        $payload = Cache::pull($cacheKey);

        if (! is_array($payload) || empty($payload['admin_id'])) {
            return response()->json(['message' => 'Invalid or expired authenticator challenge.'], 422);
        }

        $admin = Admin::whereKey($payload['admin_id'])->where('is_active', true)->first();
        if (! $admin) {
            return response()->json(['message' => 'Admin account is unavailable.'], 403);
        }

        $setupRequired = (bool) ($payload['setup_required'] ?? false);
        $secret = $setupRequired ? $admin->totp_pending_secret : $admin->totp_secret;

        if (! $secret || ! $this->totp->verify($secret, (string) $request->input('code'))) {
            $this->audit(
                AuditLog::ACTION_LOGIN_FAILED,
                "Invalid Google Authenticator code for admin '{$admin->username}'.",
                AuditLog::STATUS_FAILED,
            );

            return response()->json(['message' => 'Invalid authenticator code.'], 422);
        }

        if ($setupRequired) {
            $admin->forceFill([
                'totp_secret' => $secret,
                'totp_pending_secret' => null,
                'totp_enabled_at' => now(),
            ])->save();
        }

        $admin->tokens()->delete();
        $admin->update(['last_login_at' => now(), 'last_seen_at' => now()]);
        $token = $admin->createToken('admin-token', ['admin'], now()->addMinutes((int) config('sanctum.expiration', 480)))->plainTextToken;

        $this->audit(
            AuditLog::ACTION_LOGIN,
            "Admin '{$admin->username}' (role: {$admin->role}) logged in with Google Authenticator.",
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
            'totp_enabled'   => ! empty($admin->totp_secret),
            'last_login_at'  => $admin->last_login_at?->toISOString(),
        ];
    }
}
