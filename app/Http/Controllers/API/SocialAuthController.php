<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        try {
            $url = Socialite::driver('google')
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json(['url' => $url]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Google auth not configured: ' . $e->getMessage()
            ], 500);
        }
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name'             => $googleUser->getName(),
                    'email'            => $googleUser->getEmail(),
                    'google_id'        => $googleUser->getId(),
                    'profile_picture'  => $googleUser->getAvatar(),
                    'password'         => Hash::make(Str::random(24)),
                    'email_verified'   => true,
                    'consent_accepted' => false,
                ]
            );

            $token = $user->createToken('google-auth')->plainTextToken;

            // Redirect to React frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

            return redirect($frontendUrl . '/auth/google/callback?token=' . $token);

        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect($frontendUrl . '/login?error=google_failed&message=' . urlencode($e->getMessage()));
        }
    }
}