<?php

use App\Http\Controllers\Api;
use Illuminate\Support\Facades\Route;

// Public 
Route::prefix('auth')->group(function () {
    Route::post('/login',          [Api\AuthController::class, 'login']);
    Route::post('/register',       [Api\AuthController::class, 'register']);
    Route::post('/otp/send',       [Api\AuthController::class, 'sendOtp']);
    Route::post('/otp/verify',     [Api\AuthController::class, 'verifyOtp']);
    Route::get('/google',          [Api\SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [Api\SocialAuthController::class, 'handleGoogleCallback']);
});

Route::post('/payments/webhook',    [Api\PaymentController::class, 'webhook']);
Route::get('/announcements',        [Api\AnnouncementController::class, 'index']);
Route::get('/analytics/top-viewed', [Api\AnalyticsController::class, 'topViewed']);

// Protected 
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [Api\AuthController::class, 'logout']);
        Route::get('/me',      [Api\AuthController::class, 'me']);
    });

    // Consent 
    Route::post('/consent/accept', [Api\ConsentController::class, 'accept']);
    Route::get('/consent/status',  [Api\ConsentController::class, 'status']);

    // Profile Settings 
    Route::post('/profile/visibility', [Api\ProfileSettingsController::class, 'updateVisibility']);
    Route::post('/profile/motto',      [Api\ProfileSettingsController::class, 'updateMotto']);

    // Students 
    Route::prefix('students')->group(function () {
        Route::get('/', [Api\StudentController::class, 'index']);

        // Static profile mutation routes FIRST (before /{id} to avoid conflicts)
        Route::post('/profile/bio',                       [Api\StudentController::class, 'updateBio']);
        Route::post('/profile/photo',                     [Api\StudentController::class, 'updatePhoto']);
        Route::put('/profile/password',                   [Api\StudentController::class, 'updatePassword']);
        Route::post('/profile/tagged-photos',             [Api\StudentController::class, 'addTaggedPhoto']);
        Route::delete('/profile/tagged-photos/{photoId}', [Api\StudentController::class, 'removeTaggedPhoto']);

        // Dynamic /{id} routes AFTER static routes
        Route::get('/{id}',               [Api\StudentController::class, 'show'])->middleware('visibility');
        Route::get('/{id}/achievements',  [Api\StudentController::class, 'achievements'])->middleware('visibility');
        Route::get('/{id}/tagged-photos', [Api\StudentController::class, 'taggedPhotos'])->middleware('visibility');
        Route::post('/{id}/view',         [Api\ProfileSettingsController::class, 'trackView']);
    });

    // Faculty 
    Route::get('/faculty',      [Api\FacultyController::class, 'index']);
    Route::get('/faculty/{id}', [Api\FacultyController::class, 'show']);

    // Sections 
    Route::get('/sections',      [Api\SectionController::class, 'index']);
    Route::get('/sections/{id}', [Api\SectionController::class, 'show']);

    // Gallery (public browsing) 
    Route::prefix('gallery')->group(function () {
        Route::get('/',     [Api\GalleryController::class, 'index']);
        Route::get('/{id}', [Api\GalleryController::class, 'show']);
    });

    // Search
    Route::get('/search', [Api\SearchController::class, 'search']);

    // Messages
    Route::prefix('messages')->group(function () {
        Route::get('/conversations', [Api\MessageController::class, 'conversations']);
        Route::get('/{userId}',      [Api\MessageController::class, 'thread']);
        Route::post('/',             [Api\MessageController::class, 'send']);
        Route::patch('/{id}/read',   [Api\MessageController::class, 'markRead']);
    });

    // Voice Notes
    Route::prefix('voice-notes')->group(function () {
        Route::get('/',        [Api\VoiceNoteController::class, 'index']);
        Route::post('/',       [Api\VoiceNoteController::class, 'store']);
        Route::delete('/{id}', [Api\VoiceNoteController::class, 'destroy']);
    });

    // Yearbook 
    Route::prefix('yearbook')->group(function () {
        Route::get('/flipbook',        [Api\YearbookController::class, 'flipbookData']);
        Route::get('/export/{userId}', [Api\YearbookController::class, 'exportStudentPdf']);
    });

    // Payments
    Route::prefix('payments')->group(function () {
        Route::post('/create-intent', [Api\PaymentController::class, 'createIntent']);
        Route::get('/history',        [Api\PaymentController::class, 'history']);
        Route::get('/status',         [Api\PaymentController::class, 'subscriptionStatus']);
    });

    // Notifications
    Route::post('/notifications/register-token', [Api\NotificationController::class, 'registerToken']);
    Route::get('/notifications',                 [Api\NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read',     [Api\NotificationController::class, 'markRead']);

    // Announcements (admin only) 
    Route::post('/announcements', [Api\AnnouncementController::class, 'store']);

    // Analytics 
    Route::get('/analytics/my-stats',   [Api\AnalyticsController::class, 'myStats']);
    Route::get('/analytics/batchmates', [Api\AnalyticsController::class, 'batchmates']);

    // Premium-only routes
    Route::middleware('premium')->group(function () {
        // Yearbook premium features
        Route::get('/yearbook/certificate', [Api\YearbookController::class, 'exportCertificate']);

        // AI Face Search
        Route::post('/gallery/face-search', [Api\GalleryController::class, 'faceSearch']);

        // Transcripts
        Route::get('/transcripts',      [Api\TranscriptController::class, 'index']);
        Route::post('/transcripts',     [Api\TranscriptController::class, 'store']);
        Route::get('/transcripts/{id}', [Api\TranscriptController::class, 'show']);
    });

});