<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendOtpEmail;
use App\Models\Consent;
use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'user'             => $user->load('section'),
            'token'            => $token,
            'requires_consent' => ! $user->consent_accepted,
        ]);
    }

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
            'name'             => $request->first_name . ' ' . $request->last_name,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'student_id'       => $request->student_id,
            'course'           => $request->course,
            'consent_accepted' => true,
        ]);

        // Log consent
        Consent::create([
            'user_id'     => $user->id,
            'type'        => 'privacy_policy',
            'version'     => '1.0',
            'accepted'    => true,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'accepted_at' => now(),
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('section'));
    }

    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpVerification::updateOrCreate(
            ['email' => $request->email],
            ['otp' => $otp, 'expires_at' => now()->addMinutes(10), 'used' => false]
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
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>=', now())
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $record->update(['used' => true]);
        User::where('email', $request->email)->update(['email_verified' => true]);

        return response()->json(['message' => 'Email verified successfully.']);
    }
}