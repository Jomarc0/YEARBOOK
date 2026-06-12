<?php

use App\Http\Controllers\API\Auth\SocialAuthController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

// WEB Google OAuth
Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle'])
    ->name('auth.google.redirect');

Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle'])
    ->name('auth.google.redirect.alias');

Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

//  MOBILE Google OAuth 
Route::get('/app/auth/google', [SocialAuthController::class, 'mobileRedirectToGoogle'])
    ->name('auth.google.mobile.redirect');

Route::get('/app/auth/google/redirect', [SocialAuthController::class, 'mobileRedirectToGoogle'])
    ->name('auth.google.mobile.redirect.alias');

Route::get('/app/auth/google/callback', [SocialAuthController::class, 'mobileHandleGoogleCallback'])
    ->name('auth.google.mobile.callback');

// Temporary cache clear — REMOVE AFTER USE
Route::get('/clear-cache', function () {
    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    return 'Cache cleared!';
});

// SPA catch-all (must be LAST)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!(auth|app/auth)/).*$');