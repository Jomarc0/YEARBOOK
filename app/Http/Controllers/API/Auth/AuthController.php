<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\AI\ProcessFaceIndexing;
use App\Jobs\Notification\SendOtpEmail;
use App\Models\Batch;
use App\Models\Consent;
use App\Models\OtpVerification;
use App\Models\Student;
use App\Models\User;
use App\Models\UserPresence;
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
            'student_id'       => 'required|string|max:255|unique:users,student_id',
            'course'           => 'required|string|max:255',
            'graduation_year'  => 'required|integer|min:1990|max:2100',
            'batch'            => 'nullable|string|max:255',
            'consent_accepted' => 'required|accepted',
        ]);

        // ── Try to find a matching student record ──────────────────────────
        // Match on student_no + first_name + last_name (case-insensitive)
        $studentRecord = $this->findMatchingStudentRecord($request);

        if ($studentRecord && $studentRecord->hasRegistered()) {
            throw ValidationException::withMessages([
                'student_id' => ['A user account is already linked to this student record.'],
            ]);
        }

        // ── Create user — lean, no yearbook data copied ────────────────────
        $course = $studentRecord?->course ?: $request->course;
        $graduationYear = $studentRecord?->graduation_year ?: (int) $request->graduation_year;
        $batch = (string) ($studentRecord?->graduation_year ?: ($request->batch ?: $request->graduation_year));
        $batchId = $studentRecord?->batch_id
            ?: Batch::where('graduation_year', $graduationYear)
                ->where(function ($query) use ($course) {
                    $query->where('course', $course)->orWhereNull('course');
                })
                ->value('id');

        $user = User::create([
            'first_name'        => $studentRecord?->first_name ?? $request->first_name,
            'last_name'         => $studentRecord?->last_name ?? $request->last_name,
            'name'              => $studentRecord
                ? trim($studentRecord->first_name . ' ' . $studentRecord->last_name)
                : trim($request->first_name . ' ' . $request->last_name),
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'student_record_id' => $studentRecord?->id,   // null = browse account
            'student_id'         => $studentRecord?->student_no ?? $request->student_id,
            'course'             => $course,
            'graduation_year'    => $graduationYear,
            'batch'              => $batch,
            'section_id'        => $studentRecord?->section_id,
            'batch_id'          => $batchId,
            'profile_picture'   => $studentRecord?->photo,
            'consent_accepted'  => true,
        ]);

        // ── Consent log ───────────────────────────────────────────────────
        if ($studentRecord && filled($studentRecord->photo)) {
            ProcessFaceIndexing::dispatch($user->fresh()->load('studentRecord'));
        }

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
            'user'         => $this->authUserPayload($user),
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

        $email = strtolower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');

        $key      = 'student_login:' . sha1($email . '|' . $request->ip());
        $maxTries = (int) PlatformSettings::get('max_login_attempts');

        if (RateLimiter::tooManyAttempts($key, $maxTries)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => "Too many login attempts. Try again in {$seconds} seconds.",
                'code'    => 'LOGIN_THROTTLED',
            ], 429);
        }

        $user = User::whereRaw('LOWER(TRIM(email)) = ?', [$email])->first();

        if (! $user || ! Hash::check($password, $user->getAuthPassword())) {
            RateLimiter::hit($key, 60 * (int) PlatformSettings::get('session_timeout_minutes'));

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        RateLimiter::clear($key);

        $token = $user->createToken('app-token')->plainTextToken;
        $this->markPresence($user->id, true);

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

        $typedName = $this->normalizePersonName($request->first_name . ' ' . $request->last_name);
        $student = Student::where('student_no', trim((string) $request->student_no))
            ->get()
            ->first(function (Student $student) use ($typedName, $request) {
                $recordName = $this->normalizePersonName($student->first_name . ' ' . $student->last_name);
                $exactFirst = strtolower(trim($student->first_name)) === strtolower(trim($request->first_name));
                $exactLast = strtolower(trim($student->last_name)) === strtolower(trim($request->last_name));

                return ($exactFirst && $exactLast)
                    || $recordName === $typedName
                    || ($typedName !== '' && str_contains($recordName, $typedName))
                    || ($recordName !== '' && str_contains($typedName, $recordName));
            });

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

    private function findMatchingStudentRecord(Request $request): ?Student
    {
        $studentNo = trim((string) $request->student_id);
        $email = strtolower(trim((string) $request->email));
        $firstName = trim((string) $request->first_name);
        $lastName = trim((string) $request->last_name);
        $typedName = $this->normalizePersonName($firstName . ' ' . $lastName);

        $exact = Student::where('student_no', $studentNo)
            ->whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower($firstName)])
            ->whereRaw('LOWER(TRIM(last_name)) = ?', [strtolower($lastName)])
            ->first();

        if ($exact) {
            return $exact;
        }

        $nameMatch = Student::where('student_no', $studentNo)
            ->get()
            ->first(function (Student $student) use ($typedName) {
                $recordName = $this->normalizePersonName($student->first_name . ' ' . $student->last_name);

                return $recordName === $typedName
                    || ($typedName !== '' && str_contains($recordName, $typedName))
                    || ($recordName !== '' && str_contains($typedName, $recordName));
            });

        if ($nameMatch) {
            return $nameMatch;
        }

        if ($email !== '') {
            $emailMatch = Student::whereRaw('LOWER(TRIM(email)) = ?', [$email])->first();
            if ($emailMatch && ($studentNo === '' || $emailMatch->student_no === $studentNo)) {
                return $emailMatch;
            }
        }

        return null;
    }

    private function normalizePersonName(string $name): string
    {
        return preg_replace('/[^a-z0-9]+/', '', strtolower($name)) ?: '';
    }

    private function authUserPayload(User $user): array
    {
        return [
            'id'                 => $user->id,
            'first_name'         => $user->first_name,
            'last_name'          => $user->last_name,
            'name'               => $user->name,
            'email'              => $user->email,
            'role'               => $user->role,
            'student_record_id'  => $user->student_record_id,
            'student_id'         => $user->student_id,
            'course'             => $user->course,
            'graduation_year'    => $user->graduation_year,
            'batch'              => $user->batch,
            'section_id'         => $user->section_id,
            'batch_id'           => $user->batch_id,
            'profile_picture'    => $user->profile_picture,
            'email_verified'     => (bool) $user->email_verified,
            'consent_accepted'   => (bool) $user->consent_accepted,
        ];
    }

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
        $this->markPresence($request->user()->id, false);
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('studentRecord', 'section');
        $this->markPresence($user->id, true);
        $sub  = \App\Models\Subscription::where('user_id', $user->id)->latest()->first();
        $activeSub = $sub?->isActive() ? $sub : null;

        return response()->json([
            ...$user->toArray(),
            'is_subscribed' => (bool) $activeSub,
            'is_premium'    => $activeSub?->isPremium() ?? false,
            'tier'          => $activeSub?->tier ?? 'free',
            'plan'          => $activeSub?->plan ?? 'free',
        ]);
    }

    private function markPresence(int $userId, bool $isOnline): void
    {
        UserPresence::updateOrCreate(
            ['user_id' => $userId],
            [
                'is_online'    => $isOnline,
                'last_seen_at' => now(),
            ]
        );
    }
}
