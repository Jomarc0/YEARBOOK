<?php

use App\Http\Controllers\API\Payment\PaymentController;
use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\AI\FaceRecognitionController;
use App\Http\Controllers\API\AI\TranscriptController;
use App\Http\Controllers\API\AI\VoiceNoteController;
use App\Http\Controllers\API\Admin\VoiceNoteAdminController;
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
use App\Http\Controllers\API\AI\MemoryController;
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

Route::post('/payments/webhook',         [PaymentController::class,     'webhook']);
Route::get('/announcements',             [AnnouncementController::class, 'index']);
Route::get('/analytics/top-viewed',      [AnalyticsController::class,    'topViewed']);

// =========================================================================
// PROTECTED ROUTES  (auth:sanctum + throttle 120 req/min)
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

        Route::post('/profile/bio',                       [StudentController::class, 'updateBio']);
        Route::post('/profile/photo',                     [StudentController::class, 'updatePhoto']);
        Route::put('/profile/password',                   [StudentController::class, 'updatePassword']);
        Route::post('/profile/tagged-photos',             [StudentController::class, 'addTaggedPhoto']);
        Route::delete('/profile/tagged-photos/{photoId}', [StudentController::class, 'removeTaggedPhoto']);

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
    Route::get('/batchmates', [BatchController::class, 'batchmates']);

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
        Route::get('/conversations', [MessageController::class, 'conversations']);
        Route::get('/unread-count',  [MessageController::class, 'unreadCount']);
        Route::post('/typing',       [MessageController::class, 'typing']);
        Route::post('/',             [MessageController::class, 'send']);
        Route::get('/{userId}',      [MessageController::class, 'thread']);
        Route::patch('/{id}/read',   [MessageController::class, 'markRead']);
    });

    // ── Presence ──────────────────────────────────────────────────────────────
    Route::prefix('presence')->group(function () {
        Route::post('/',     [PresenceController::class, 'update']);
        Route::post('/bulk', [PresenceController::class, 'bulk']);
    });

    // ── Voice Notes ───────────────────────────────────────────────────────────
    Route::prefix('voice-notes')->group(function () {
        Route::get('/inbox',              [VoiceNoteController::class, 'inbox']);       // notes received (approved)
        Route::get('/outbox',             [VoiceNoteController::class, 'outbox']);      // notes sent (all statuses)
        Route::get('/profile/{userId}',   [VoiceNoteController::class, 'forProfile']); // public profile section
        Route::post('/',                  [VoiceNoteController::class, 'store']);       // send a note
        Route::delete('/{id}',            [VoiceNoteController::class, 'destroy']);     // sender deletes
    });

    // ── Graduation ────────────────────────────────────────────────────────────
    Route::prefix('graduation')->group(function () {
        Route::get('/',                   [GraduationController::class, 'index']);
        Route::get('/{id}',               [GraduationController::class, 'show']);
        Route::post('/album',             [GraduationController::class, 'createAlbum']);
        Route::post('/upload-photo',      [GraduationController::class, 'uploadPhoto']);
        Route::post('/upload-video',      [GraduationController::class, 'uploadVideo']);
        Route::post('/upload-program',    [GraduationController::class, 'uploadProgram']);
        Route::post('/upload-invitation', [GraduationController::class, 'uploadInvitation']);
        Route::post('/upload-song',       [GraduationController::class, 'uploadSong']);
        Route::post('/upload-mass',       [GraduationController::class, 'uploadMass']);
        Route::delete('/{id}',            [GraduationController::class, 'destroy']);
    });

    // ── Media ─────────────────────────────────────────────────────────────────
    Route::prefix('media')->group(function () {
        Route::post('/bulk-upload',  [MediaController::class, 'bulkUpload']);
        Route::post('/upload-video', [MediaController::class, 'uploadVideo']);
        Route::delete('/photo/{id}', [MediaController::class, 'deletePhoto']);
    });

    // ── Yearbook ──────────────────────────────────────────────────────────────
    Route::prefix('yearbook')->group(function () {
        // Existing — unchanged
        Route::get('/flipbook',        [YearbookController::class, 'flipbookData']);
        Route::get('/export/{userId}', [YearbookController::class, 'exportStudentPdf']);

        // Search inside yearbook
        Route::get('/search', [YearbookController::class, 'search']);

        // Bookmarks
        Route::get('/bookmarks/{batchId}',        [YearbookController::class, 'getBookmarks']);
        Route::post('/bookmark',                  [YearbookController::class, 'addBookmark']);
        Route::delete('/bookmark/{bookmark}',     [YearbookController::class, 'removeBookmark']);
    });

    // ── Yearbooks (batch-scoped) ───────────────────────────────────────────────
    Route::prefix('yearbooks')->group(function () {

        // Yearbook metadata
        Route::get('{batch}',       [YearbookController::class, 'show'])
            ->name('yearbooks.show');

        // Flipbook page data for FlipbookViewer
        Route::get('{batch}/pages', [YearbookController::class, 'pages'])
            ->name('yearbooks.pages');

        // Galleries list & detail
        Route::get('{batch}/galleries',           [GalleryController::class, 'index'])
            ->name('yearbooks.galleries.index');
        Route::get('{batch}/galleries/{gallery}', [GalleryController::class, 'show'])
            ->name('yearbooks.galleries.show');

        // Upload photo
        Route::post('{batch}/photos', [YearbookController::class, 'uploadPhoto'])
            ->middleware('throttle:20,1')
            ->name('yearbooks.photos.upload');
    });

    // Standalone gallery detail
    Route::get('galleries/{gallery}', [GalleryController::class, 'show'])
        ->name('galleries.show');

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
        Route::get('/batchmates', [AnalyticsController::class, 'batchmates']);
    });


    // ── Memory Digest ─────────────────────────────────────────────────────────
    Route::prefix('memories')->group(function () {
        Route::get('/digest',      [MemoryController::class, 'digest']);
        Route::get('/on-this-day', [MemoryController::class, 'onThisDay']);
    });

    // =========================================================================
    // PREMIUM-ONLY ROUTES
    // =========================================================================
    Route::middleware('premium')->group(function () {

        // ── Yearbook certificate export ────────────────────────────────────────
        Route::get('/yearbook/certificate', [YearbookController::class, 'exportCertificate']);

        // ── Yearbook download (watermarked PDF, throttled) ────────────────────
        Route::get('yearbooks/{batch}/download', [YearbookController::class, 'download'])
            ->middleware('throttle:5,1')
            ->name('yearbooks.download');

        // ── Admin: trigger PDF generation ─────────────────────────────────────
        Route::post('yearbooks/{batch}/generate', [YearbookController::class, 'generate'])
            ->middleware('can:admin')
            ->name('yearbooks.generate');

        // ── Gallery face search ────────────────────────────────────────────────
        Route::post('/gallery/face-search', [GalleryController::class, 'faceSearch']);

        // ── Transcripts ───────────────────────────────────────────────────────
        Route::prefix('transcripts')->group(function () {
            Route::get('/',               [TranscriptController::class, 'index']);
            Route::post('/',              [TranscriptController::class, 'store']);
            Route::get('/{id}',           [TranscriptController::class, 'show']);
            Route::delete('/{id}',        [TranscriptController::class, 'destroy']);
            Route::get('/{id}/subtitles', [TranscriptController::class, 'subtitles']);
            Route::post('/{id}/notes',    [TranscriptController::class, 'regenerateNotes']);
        });
    });
    // ── Admin: Voice Note Moderation ──────────────────────────────────────────────
    Route::middleware('can:admin')->prefix('admin/voice-notes')->group(function () {
    Route::get('/',              [VoiceNoteAdminController::class, 'index']);    // list by status
    Route::get('/stats',         [VoiceNoteAdminController::class, 'stats']);   // counts
    Route::post('/{id}/approve', [VoiceNoteAdminController::class, 'approve']); // approve
    Route::post('/{id}/reject',  [VoiceNoteAdminController::class, 'reject']);  // reject
});
});