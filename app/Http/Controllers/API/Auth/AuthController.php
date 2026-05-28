<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendOtpEmail;
use App\Models\Consent;
use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Services\Notification\PHPMailerService;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // ── Register ───────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $request->validate([
            'first_name'       => 'required|string|max:255',
            'last_name'        => 'required|string|max:255',
            'email'            => 'required|email|unique:users',
            'password'         => 'required|min:8|confirmed',
            'student_id'       => 'required|unique:users,student_id',
            'course'           => 'nullable|string|max:255',
            'consent_accepted' => 'required|accepted',
        ]);

        $user = User::create([
            'first_name'       => $request->first_name,
            'last_name'        => $request->last_name,
            'name'             => $request->first_name . ' ' . $request->last_name,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'student_id'       => $request->student_id,
            'course'           => $request->course,
            'consent_accepted' => true,
        ]);

        Consent::create([
            'user_id'     => $user->id,
            'type'        => 'privacy_policy',
            'version'     => '1.0',
            'accepted'    => true,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'accepted_at' => now(),
        ]);

        $token = $user->createToken('app-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    // ── Login ──────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('app-token')->plainTextToken;

        return response()->json([
            'user'             => $user->load('section'),
            'token'            => $token,
            'requires_consent' => ! $user->consent_accepted,
        ]);
    }

    // ── OTP (login / registration) ─────────────────────────────────────

    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpVerification::updateOrCreate(
            ['email' => $request->email, 'type' => 'verification'],
            [
                'otp'        => $otp,
                'expires_at' => now()->addMinutes(10),
                'used'       => false,
            ]
        );

        SendOtpEmail::dispatch($request->email, $otp);

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $record = OtpVerification::where('email', $request->email)
            ->where('type', 'verification')
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>=', now())
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $record->update(['used' => true]);

        User::where('email', $request->email)
            ->update(['email_verified' => true]);

        return response()->json(['message' => 'Email verified successfully.']);
    }

    // ── Forgot Password ────────────────────────────────────────────────

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return response()->json(['message' => 'If that email is registered, a reset code has been sent.']);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpVerification::updateOrCreate(
            ['email' => $request->email, 'type' => 'password_reset'],
            [
                'otp'         => $otp,
                'expires_at'  => now()->addMinutes(10),
                'used'        => false,
                'reset_token' => null,
            ]
        );

        try {
            app(PHPMailerService::class)->sendPasswordReset(
                $request->email,
                $user->name,
                $otp
            );
        } catch (\Throwable $e) {
            Log::error('forgotPassword mailer failed: ' . $e->getMessage());
            // Still return success so OTP step proceeds; email failure shouldn't block the flow
        }

        return response()->json(['message' => 'If that email is registered, a reset code has been sent.']);
    }

    public function verifyResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $record = OtpVerification::where('email', $request->email)
            ->where('type', 'password_reset')
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>=', now())
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        // Issue a short-lived token that authorises the actual password change.
        // Don't mark used yet — mark it only when the password is saved.
        $resetToken = Str::random(64);
        $record->update(['reset_token' => $resetToken]);

        return response()->json(['reset_token' => $resetToken]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'reset_token'           => 'required|string',
            'password'              => 'required|min:8|confirmed',
        ]);

        $record = OtpVerification::where('email', $request->email)
            ->where('type', 'password_reset')
            ->where('reset_token', $request->reset_token)
            ->where('used', false)
            ->where('expires_at', '>=', now())
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid or expired reset session. Please start over.'], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Consume the record so the token can't be reused
        $record->update(['used' => true, 'reset_token' => null]);

        // Revoke all Sanctum tokens → forces re-login on all devices
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }

    // ── Misc ───────────────────────────────────────────────────────────

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('section');
        $sub  = \App\Models\Subscription::where('user_id', $user->id)->latest()->first();

        return response()->json([
            ...$user->toArray(),
            'is_premium' => $sub?->isActive() ?? false,
            'tier'       => $sub ? ($sub->isActive() ? 'premium' : 'free') : 'free',
        ]);
    }
}