<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendOtpEmail;
use App\Models\Consent;
use App\Models\OtpVerification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Services\Notification\PHPMailerService;
use App\Support\PlatformSettings;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    // ── Register ───────────────────────────────────────────────────────────

    public function register(Request $request)
    {
        if (PlatformSettings::bool('maintenance_mode')) {
            return PlatformSettings::maintenanceResponse();
        }

        $request->validate([
            'first_name'       => 'required|string|max:255',
            'last_name'        => 'required|string|max:255',
            'email'            => 'required|email|unique:users',
            'password'         => 'required|min:8|confirmed',
            // student_id here is the student NUMBER string (e.g. "2021-00123")
            // used only for lookup — not stored in users anymore
            'student_id'       => 'required|string|max:255',
            'consent_accepted' => 'required|accepted',
        ]);

        // ── Try to find a matching student record ──────────────────────────
        // Match on student_no + first_name + last_name (case-insensitive)
        $studentRecord = Student::where('student_no', $request->student_id)
            ->whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower(trim($request->first_name))])
            ->whereRaw('LOWER(TRIM(last_name)) = ?',  [strtolower(trim($request->last_name))])
            ->first();

        // ── Create user — lean, no yearbook data copied ────────────────────
        $user = User::create([
            'first_name'        => $request->first_name,
            'last_name'         => $request->last_name,
            'name'              => trim($request->first_name . ' ' . $request->last_name),
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'student_record_id' => $studentRecord?->id,   // null = browse account
            // Pull section/batch from student record if matched
            'section_id'        => $studentRecord?->section_id,
            'batch_id'          => $studentRecord?->batch_id,
            'consent_accepted'  => true,
        ]);

        // ── Consent log ───────────────────────────────────────────────────
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

        // Load studentRecord so accessors resolve correctly in the response
        $user->load('studentRecord', 'section');

        return response()->json([
            'user'         => $user,
            'access_token' => $token,
            // Tell the frontend whether they were matched as a graduate
            'is_graduate'  => ! is_null($studentRecord),
        ], 201);
    }

    // ── Login ──────────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        if (PlatformSettings::bool('maintenance_mode')) {
            return PlatformSettings::maintenanceResponse();
        }

        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $key      = 'student_login:' . sha1(strtolower($request->email) . '|' . $request->ip());
        $maxTries = (int) PlatformSettings::get('max_login_attempts');

        if (RateLimiter::tooManyAttempts($key, $maxTries)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => "Too many login attempts. Try again in {$seconds} seconds.",
                'code'    => 'LOGIN_THROTTLED',
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60 * (int) PlatformSettings::get('session_timeout_minutes'));

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        RateLimiter::clear($key);

        $token = $user->createToken('app-token')->plainTextToken;

        return response()->json([
            'user'             => $user->load('studentRecord', 'section'),
            'token'            => $token,
            'requires_consent' => ! $user->consent_accepted,
        ]);
    }

    // ── Student lookup (called by RegisterPage before submit) ──────────────
    // Checks if name + student_no match a student record.
    // Returns safe preview data only — no sensitive fields.

    public function verifyStudent(Request $request)
    {
        $request->validate([
            'student_no' => 'required|string',
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
        ]);

        $student = Student::where('student_no', $request->student_no)
            ->whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower(trim($request->first_name))])
            ->whereRaw('LOWER(TRIM(last_name)) = ?',  [strtolower(trim($request->last_name))])
            ->first();

        if (! $student) {
            return response()->json(['found' => false]);
        }

        // Check if already registered
        if ($student->hasRegistered()) {
            return response()->json([
                'found'   => false,
                'message' => 'A user account is already linked to this student record.',
            ]);
        }

        return response()->json([
            'found'   => true,
            'student' => [
                'student_no'      => $student->student_no,
                'first_name'      => $student->first_name,
                'last_name'       => $student->last_name,
                'course'          => $student->course,
                'honors'          => $student->honors,
                'graduation_year' => $student->graduation_year,
                'photo'           => $student->photo_url,
                // Pre-fill hints for the form (email from student record if set)
                'email'           => $student->email,
            ],
        ]);
    }

    // ── OTP ────────────────────────────────────────────────────────────────

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

    // ── Forgot Password ────────────────────────────────────────────────────

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

        $resetToken = Str::random(64);
        $record->update(['reset_token' => $resetToken]);

        return response()->json(['reset_token' => $resetToken]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'       => 'required|email',
            'reset_token' => 'required|string',
            'password'    => 'required|min:8|confirmed',
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
        $record->update(['used' => true, 'reset_token' => null]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }

    // ── Misc ───────────────────────────────────────────────────────────────

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('studentRecord', 'section');
        $sub  = \App\Models\Subscription::where('user_id', $user->id)->latest()->first();

        return response()->json([
            ...$user->toArray(),
            'is_premium' => $sub?->isActive() ?? false,
            'tier'       => $sub ? ($sub->isActive() ? 'premium' : 'free') : 'free',
        ]);
    }
}