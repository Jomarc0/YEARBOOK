<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use App\Models\User;
use App\Models\UserPresence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private function frontendUrl(): string
    {
        return rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
    }

    public function redirectToGoogle(Request $request)
    {
        $redirectUri = $request->query('redirect_uri');

        if (is_string($redirectUri) && preg_match('/^(capstoneapp:\/\/|exp:\/\/|http:\/\/localhost|http:\/\/127\.0\.0\.1)/', $redirectUri)) {
            session(['google_oauth_redirect_uri' => $redirectUri]);
        } elseif ($request->query('client') === 'mobile') {
            session(['google_oauth_redirect_uri' => 'capstoneapp://sso/callback']);
        } else {
            session()->forget('google_oauth_redirect_uri');
        }

        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        $frontend = $this->frontendUrl();

    // ── 1. Exchange code for Google user ─────────────────────────────────
    try {
        $googleUser = Socialite::driver('google')->user();
    } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
        Log::warning('Google OAuth: InvalidStateException — session likely expired or duplicate callback.', [
            'message' => $e->getMessage(),
        ]);
        return redirect("{$frontend}/login?error=sso_failed");
    } catch (\Exception $e) {
        Log::error('Google OAuth callback failed', [
            'exception' => get_class($e),
            'message'   => $e->getMessage(),
        ]);
        return redirect("{$frontend}/login?error=sso_failed");
    }

        // ── 2. Validate email is present ─────────────────────────────────────
        $email = $googleUser->getEmail();
        if (! $email) {
            Log::warning('Google OAuth: no email returned from Google.');
            return redirect("{$frontend}/login?error=sso_failed");
        }

        // ── 3. Upsert user record ─────────────────────────────────────────────
        try {
            $nameParts = explode(' ', trim($googleUser->getName()), 2);

            $user = User::where('google_id', $googleUser->getId())
                        ->orWhere('email', $email)
                        ->first();

            if ($user) {
                // Existing user — link Google account and refresh token/avatar
                $user->update([
                    'google_id'         => $googleUser->getId(),
                    'google_token'      => $googleUser->token,
                    'avatar'            => $googleUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                    'consent_accepted'  => true,
                ]);
            } else {
                // Brand new user — create full record
                $user = User::create([
                    'google_id'         => $googleUser->getId(),
                    'name'              => $googleUser->getName(),
                    'first_name'        => $nameParts[0] ?? '',
                    'last_name'         => $nameParts[1] ?? '',
                    'email'             => $email,
                    'google_token'      => $googleUser->token,
                    'avatar'            => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'consent_accepted'  => true,
                    'password'          => Hash::make(Str::random(32)),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Google OAuth: failed to upsert user', [
                'email'     => $email,
                'exception' => get_class($e),
                'message'   => $e->getMessage(),
            ]);
            return redirect("{$frontend}/login?error=sso_failed");
        }

        // ── 4. Auto-create consent log for new SSO users ──────────────────────
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

        // ── 5. Issue Sanctum token ────────────────────────────────────────────
        $user->tokens()->where('name', 'google-sso')->delete();
        $token = $user->createToken('google-sso')->plainTextToken;
        UserPresence::updateOrCreate(
            ['user_id' => $user->id],
            [
                'is_online'    => true,
                'last_seen_at' => now(),
            ]
        );

        // ── 6. Send token to React via URL param ──────────────────────────────
        $mobileRedirect = session()->pull('google_oauth_redirect_uri');

        if ($mobileRedirect) {
            $separator = str_contains($mobileRedirect, '?') ? '&' : '?';
            return redirect("{$mobileRedirect}{$separator}token={$token}");
        }

        return redirect("{$frontend}/sso/callback?token={$token}");
    }
}
