<?php

use App\Http\Controllers\API\Payment\PaymentController;
use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\AI\FaceRecognitionController;
use App\Http\Controllers\API\AI\TranscriptController;
use App\Http\Controllers\API\AI\VoiceNoteController;
use App\Http\Controllers\API\Analytics\AnalyticsController;
use App\Http\Controllers\API\Auth\ConsentController;
use App\Http\Controllers\API\Section\BatchController;            
use App\Http\Controllers\API\Faculty\FacultyController;
use App\Http\Controllers\API\Search\SearchController;
use App\Http\Controllers\API\Section\SectionController;
use App\Http\Controllers\API\Social\MessageController;
use App\Http\Controllers\API\Social\NotificationController;
use App\Http\Controllers\API\Student\ProfileSettingsController;
use App\Http\Controllers\API\Student\ProfileController;
use App\Http\Controllers\API\Student\StudentController;
use App\Http\Controllers\API\Yearbook\AnnouncementController;
use App\Http\Controllers\API\Yearbook\GalleryController;
use App\Http\Controllers\API\Yearbook\GraduationController;
use App\Http\Controllers\API\Yearbook\MediaController;
use App\Http\Controllers\API\Yearbook\YearbookController;
use App\Http\Controllers\API\Social\PresenceController;
use Illuminate\Support\Facades\Route;


// =========================================================================
// PUBLIC ROUTES
// =========================================================================

Route::prefix('auth')->group(function () {
    Route::post('/login',      [AuthController::class, 'login']);
    Route::post('/register',   [AuthController::class, 'register']);
    Route::post('/otp/send',   [AuthController::class, 'sendOtp']);
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
});

Route::post('/payments/webhook',         [PaymentController::class,    'webhook']);
Route::get('/announcements',             [AnnouncementController::class,'index']);
Route::get('/analytics/top-viewed',      [AnalyticsController::class,   'topViewed']);

// =========================================================================
// PROTECTED ROUTES
// =========================================================================

Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // ── Consent ───────────────────────────────────────────────────────────────
    Route::prefix('consent')->group(function () {
        Route::post('/accept', [ConsentController::class, 'accept']);
        Route::get('/status',  [ConsentController::class, 'status']);
    });

    // ── Profile ───────────────────────────────────────────────────────────────
    Route::prefix('profile')->group(function () {
        Route::post('/visibility',        [ProfileSettingsController::class, 'updateVisibility']);
        Route::post('/motto',             [ProfileSettingsController::class, 'updateMotto']);
        Route::get('/storage-usage',      [ProfileController::class,         'storageUsage']);
        Route::post('/upload',            [ProfileController::class,         'uploadMedia']);
        Route::patch('/posts/{photoId}',  [ProfileController::class,         'updatePost']);
        Route::delete('/posts/{photoId}', [ProfileController::class,         'deletePost']);
    });

    // ── Students ──────────────────────────────────────────────────────────────
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);

        Route::post('/profile/bio',                        [StudentController::class, 'updateBio']);
        Route::post('/profile/photo',                      [StudentController::class, 'updatePhoto']);
        Route::put('/profile/password',                    [StudentController::class, 'updatePassword']);
        Route::post('/profile/tagged-photos',              [StudentController::class, 'addTaggedPhoto']);
        Route::delete('/profile/tagged-photos/{photoId}',  [StudentController::class, 'removeTaggedPhoto']);

        Route::get('/{id}/posts', [ProfileController::class, 'getPosts']);

        Route::middleware('visibility')->group(function () {
            Route::get('/{id}',               [StudentController::class, 'show']);
            Route::get('/{id}/achievements',  [StudentController::class, 'achievements']);
            Route::get('/{id}/tagged-photos', [StudentController::class, 'taggedPhotos']);
        });

        Route::post('/{id}/view', [ProfileSettingsController::class, 'trackView']);
    });

    // ── Faculty ───────────────────────────────────────────────────────────────
    Route::prefix('faculty')->group(function () {
        Route::get('/',     [FacultyController::class, 'index']);
        Route::get('/{id}', [FacultyController::class, 'show']);
    });

    // ── Sections ──────────────────────────────────────────────────────────────
    Route::prefix('sections')->group(function () {
        Route::get('/',     [SectionController::class, 'index']);
        Route::get('/{id}', [SectionController::class, 'show']);
    });

    // ── Batches ───────────────────────────────────────────────────────────────
    Route::prefix('batches')->group(function () {
        Route::get('/',                 [BatchController::class, 'index']);
        Route::get('/{batch}',          [BatchController::class, 'show']);
        Route::get('/{batch}/students', [BatchController::class, 'students']);
    });

    // ── Discovery ─────────────────────────────────────────────────────────────
    //
    //   VIEW MODE 1 — Batch:         GET /api/batchmates
    //   VIEW MODE 2 — Section:       GET /api/discover/sectionmates
    //   VIEW MODE 3 — Whole School:  GET /api/discover/school
    //   VIEW MODE 4 — Cross-Program: GET /api/discover/cross-program
    //   Department:                  GET /api/discover/department/{dept}
    //
    Route::get('/batchmates',                          [BatchController::class, 'batchmates']);

    Route::prefix('discover')->group(function () {
        Route::get('/sectionmates',            [BatchController::class, 'sectionmates']);
        Route::get('/school',                  [BatchController::class, 'wholeSchool']);
        Route::get('/cross-program',           [BatchController::class, 'crossProgram']);
        Route::get('/department/{department}', [BatchController::class, 'byDepartment']);
    });

    // ── Gallery ───────────────────────────────────────────────────────────────
    Route::prefix('gallery')->group(function () {
        Route::get('/',     [GalleryController::class, 'index']);
        Route::get('/{id}', [GalleryController::class, 'show']);
    });

    // ── Search ────────────────────────────────────────────────────────────────
    Route::get('/search', [SearchController::class, 'search']);

    Route::prefix('search/students')->group(function () {
        Route::get('/suggest', [SearchController::class, 'suggest']);
        Route::get('/filters', [SearchController::class, 'studentFilters']);
        Route::get('/',        [SearchController::class, 'students']);
    });

    // ── Face Recognition ──────────────────────────────────────────────────────
    Route::prefix('face')->group(function () {
        Route::post('/sync',                     [FaceRecognitionController::class, 'syncStudents']);
        Route::post('/search',                   [FaceRecognitionController::class, 'search']);
        Route::get('/photos/{photo}/tags',       [FaceRecognitionController::class, 'photoTags']);
        Route::post('/photos/{photo}/analyze',   [FaceRecognitionController::class, 'analyzePhoto']);
        Route::post('/albums/{albumId}/analyze', [FaceRecognitionController::class, 'analyzeAlbum']);
        Route::get('/students/{userId}/photos',  [FaceRecognitionController::class, 'studentPhotos']);
    });

    // ── Messages ──────────────────────────────────────────────────────────────
    Route::prefix('messages')->group(function () {
        Route::get('/conversations',  [MessageController::class, 'conversations']);
        Route::get('/unread-count',   [MessageController::class, 'unreadCount']);   // ← new
        Route::post('/typing',        [MessageController::class, 'typing']);        // ← new
        Route::post('/',              [MessageController::class, 'send']);
        Route::get('/{userId}',       [MessageController::class, 'thread']);
        Route::patch('/{id}/read',    [MessageController::class, 'markRead']);
    });

    // ── Presence ──────────────────────────────────────────────────────────────
    Route::prefix('presence')->group(function () {
        Route::post('/',      [PresenceController::class, 'update']);   // ← new
        Route::post('/bulk',  [PresenceController::class, 'bulk']);     // ← new
    });

    // ── Voice Notes ───────────────────────────────────────────────────────────
    Route::prefix('voice-notes')->group(function () {
        Route::get('/',        [VoiceNoteController::class, 'index']);
        Route::post('/',       [VoiceNoteController::class, 'store']);
        Route::delete('/{id}', [VoiceNoteController::class, 'destroy']);
    });

    // ── Graduation ────────────────────────────────────────────────────────────
    Route::prefix('graduation')->group(function () {
        Route::get('/',                [GraduationController::class, 'index']);
        Route::get('/{id}',            [GraduationController::class, 'show']);
        Route::post('/album',          [GraduationController::class, 'createAlbum']);
        Route::post('/upload-photo',   [GraduationController::class, 'uploadPhoto']);
        Route::post('/upload-video',   [GraduationController::class, 'uploadVideo']);
        Route::post('/upload-program', [GraduationController::class, 'uploadProgram']);
        Route::delete('/{id}',         [GraduationController::class, 'destroy']);
        Route::post('/upload-invitation', [GraduationController::class, 'uploadInvitation']);
        Route::post('/upload-song',       [GraduationController::class, 'uploadSong']);
        Route::post('/upload-mass',       [GraduationController::class, 'uploadMass']);
    });

    // ── Media ─────────────────────────────────────────────────────────────────
    Route::prefix('media')->group(function () {
        Route::post('/bulk-upload',  [MediaController::class, 'bulkUpload']);
        Route::post('/upload-video', [MediaController::class, 'uploadVideo']);
        Route::delete('/photo/{id}', [MediaController::class, 'deletePhoto']);
    });

    // ── Yearbook ──────────────────────────────────────────────────────────────
    Route::prefix('yearbook')->group(function () {
        Route::get('/flipbook',        [YearbookController::class, 'flipbookData']);
        Route::get('/export/{userId}', [YearbookController::class, 'exportStudentPdf']);
    });

    // ── Payments ──────────────────────────────────────────────────────────────
    Route::prefix('payments')->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createIntent']);
        Route::get('/history',        [PaymentController::class, 'history']);
        Route::get('/status',         [PaymentController::class, 'subscriptionStatus']);
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/',                [NotificationController::class, 'index']);
        Route::post('/register-token', [NotificationController::class, 'registerToken']);
        Route::post('/read-all',       [NotificationController::class, 'markAll']);
        Route::post('/{id}/read',      [NotificationController::class, 'markRead']);
    });

    // ── Announcements ─────────────────────────────────────────────────────────
    Route::post('/announcements', [AnnouncementController::class, 'store']);

    // ── Analytics ─────────────────────────────────────────────────────────────
    Route::prefix('analytics')->group(function () {
        Route::get('/',           [AnalyticsController::class, 'summary']);
        Route::get('/my-stats',   [AnalyticsController::class, 'myStats']);
        Route::get('/batchmates', [AnalyticsController::class, 'batchmates']); // legacy
    });

    // =========================================================================
    // PREMIUM-ONLY ROUTES
    // =========================================================================
    Route::middleware('premium')->group(function () {
        Route::get('/yearbook/certificate', [YearbookController::class, 'exportCertificate']);
        Route::post('/gallery/face-search', [GalleryController::class,  'faceSearch']);

        Route::prefix('transcripts')->group(function () {
            Route::get('/',     [TranscriptController::class, 'index']);
            Route::post('/',    [TranscriptController::class, 'store']);
            Route::get('/{id}', [TranscriptController::class, 'show']);
            Route::get('/transcripts/{id}/subtitles', [TranscriptController::class, 'subtitles']);
            Route::post('/transcripts/{id}/notes',    [TranscriptController::class, 'regenerateNotes']);
            Route::delete('/transcripts/{id}',        [TranscriptController::class, 'destroy']);
        });
    });


        Route::prefix('yearbooks')->group(function () {
    
        // ── Public (authenticated users) ────────────────────────────────────────
    
        // Yearbook metadata
        Route::get('{batch}', [YearbookController::class, 'show'])
            ->name('yearbooks.show');
    
        // Flipbook page data for FlipbookViewer
        Route::get('{batch}/pages', [YearbookController::class, 'pages'])
            ->name('yearbooks.pages');
    
        // Galleries list
        Route::get('{batch}/galleries', [GalleryController::class, 'index'])
            ->name('yearbooks.galleries.index');
    
        Route::get('{batch}/galleries/{gallery}', [GalleryController::class, 'show'])
            ->name('yearbooks.galleries.show');
    
        // Upload photo (any authenticated student/admin)
        Route::post('{batch}/photos', [YearbookController::class, 'uploadPhoto'])
            ->middleware('throttle:20,1')
            ->name('yearbooks.photos.upload');
    
        // ── Premium only ────────────────────────────────────────────────────────
    
        // Download watermarked PDF (requires active subscription)
        Route::get('{batch}/download', [YearbookController::class, 'download'])
            ->middleware(['CheckPremium', 'throttle:5,1'])
            ->name('yearbooks.download');
    
        // ── Admin only ──────────────────────────────────────────────────────────
    
        // Trigger PDF generation job
        Route::post('{batch}/generate', [YearbookController::class, 'generate'])
            ->middleware('can:admin')
            ->name('yearbooks.generate');
    });
    
    // Standalone gallery routes
    Route::get('galleries/{gallery}', [GalleryController::class, 'show'])
        ->name('galleries.show');

});