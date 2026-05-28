<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * The React frontend URL.
     * Uses FRONTEND_URL from .env (already set to http://localhost:5173).
     */
    private function frontendUrl(): string
    {
        return rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
    }

    /**
     * Step 1 — Redirect browser to Google's consent screen.
     *
     * Called by: window.location.href = 'http://127.0.0.1:8000/auth/google/redirect'
     *
     * NOTE: Do NOT use ->stateless() here.
     * We are in the web middleware group (sessions available), and stateless()
     * breaks the CSRF/state verification that protects against OAuth hijacking.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Step 2 — Google redirects back here after the user consents.
     *
     * On success → redirects React to /sso/callback?token=xxx
     * On failure → redirects React to /login?error=sso_failed
     */
    public function handleGoogleCallback(Request $request)
    {
        $frontend = $this->frontendUrl();

        // ── 1. Exchange code for Google user ─────────────────────────────────
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            Log::error('Google OAuth callback failed', [
                'exception' => get_class($e),
                'message'   => $e->getMessage(),
            ]);
            return redirect("{$frontend}/login?error=sso_failed");
        }

        // ── 2. Domain whitelist — only @nu-lipa.edu.ph ───────────────────────
        if (! str_ends_with($googleUser->getEmail(), '@nu-lipa.edu.ph')) {
            return redirect("{$frontend}/login?error=unauthorized_domain");
        }

        // ── 3. Upsert user record ─────────────────────────────────────────────
        $nameParts = explode(' ', trim($googleUser->getName()), 2);

        $user = User::updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name'              => $googleUser->getName(),
                'first_name'        => $nameParts[0] ?? '',
                'last_name'         => $nameParts[1] ?? '',
                'email'             => $googleUser->getEmail(),
                'google_token'      => $googleUser->token,
                'avatar'            => $googleUser->getAvatar(),
                'email_verified_at' => now(),         // marks email as verified
                'consent_accepted'  => true,
                'password'          => Hash::make(Str::random(32)), // unusable password
            ]
        );

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
        // Delete old SSO tokens to prevent token accumulation
        $user->tokens()->where('name', 'google-sso')->delete();
        $token = $user->createToken('google-sso')->plainTextToken;

        // ── 6. Send token to React via URL param ──────────────────────────────
        // React's SSOCallbackPage will read ?token= and store it in localStorage
        return redirect("{$frontend}/sso/callback?token={$token}");
    }
}