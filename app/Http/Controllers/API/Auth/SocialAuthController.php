<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL') . '/login?error=sso_failed');
        }

        // 🔒 Only allow NU Lipa Google accounts
        if (! str_ends_with($googleUser->getEmail(), '@nu-lipa.edu.ph')) {
            return redirect(env('FRONTEND_URL') . '/login?error=unauthorized_domain');
        }

        $nameParts = explode(' ', $googleUser->getName(), 2);

        $user = User::updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name'             => $googleUser->getName(),
                'first_name'       => $nameParts[0] ?? '',
                'last_name'        => $nameParts[1] ?? '',
                'email'            => $googleUser->getEmail(),
                'google_token'     => $googleUser->token,
                'avatar'           => $googleUser->getAvatar(),
                'email_verified'   => true,
                'consent_accepted' => true,
                'password'         => Hash::make(Str::random(32)),
            ]
        );

        if ($user->wasRecentlyCreated) {
            Consent::create([
                'user_id'     => $user->id,
                'type'        => 'privacy_policy',
                'version'     => '1.0',
                'accepted'    => true,
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'accepted_at' => now(),
            ]);
        }

        $token = $user->createToken('google-sso')->plainTextToken;

        return redirect(env('FRONTEND_URL') . '/sso/callback?token=' . $token);
    }
}