<?php

use App\Http\Controllers\API\Auth\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Google OAuth MUST live here (web.php), NOT api.php.
| Reason: Socialite uses sessions + HTTP redirects, which require the
| "web" middleware group. The API middleware group is stateless (no sessions).
|
| These routes are PUBLIC — no auth middleware — because the whole point
| is that the user is not logged in yet.
|--------------------------------------------------------------------------
*/

// ── Google OAuth ───────────────────────────────────────────────────────────
Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle'])
    ->name('auth.google.redirect');

Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

// ── React SPA catch-all ────────────────────────────────────────────────────
// IMPORTANT: This must come LAST. The negative lookahead ensures it never
// swallows the /auth/google/* routes above.
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!auth/).*$');