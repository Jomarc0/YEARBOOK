<?php
/**
 * yearbook_routes.php
 * routes/yearbook.php   ← include this in routes/api.php
 *
 * Add to routes/api.php:
 *   Route::middleware('auth:sanctum')->group(function () {
 *       require __DIR__ . '/yearbook.php';
 *   });
 *
 * All routes are auth-guarded via the outer middleware group.
 */

use App\Http\Controllers\API\Yearbook\YearbookController;
use Illuminate\Support\Facades\Route;

Route::prefix('yearbook')->group(function () {

    // ── Existing endpoints (keep exactly as-is) ─────────────────────────────
    Route::get('/flipbook',                    [YearbookController::class, 'flipbookData']);
    Route::get('/export/{userId}',             [YearbookController::class, 'exportStudentPdf']);
    Route::get('/certificate',                 [YearbookController::class, 'exportCertificate']);

    // ── New endpoints ───────────────────────────────────────────────────────

    // Yearbook metadata (cover config, school name, year)
    Route::get('/meta/{batch}',                [YearbookController::class, 'meta']);

    // Table of contents semantic entries
    Route::get('/toc/{batch}',                 [YearbookController::class, 'tableOfContents']);

    // Section data with student lists
    Route::get('/sections/{batch}',            [YearbookController::class, 'sectionPages']);

    // Gallery spreads
    Route::get('/galleries/{batch}',           [YearbookController::class, 'galleryPages']);

    // Faculty page data
    Route::get('/faculty/{batch}',             [YearbookController::class, 'facultyPage']);

    // Full-text search (?batchId=&q=)
    Route::get('/search',                      [YearbookController::class, 'search']);

    // Bookmarks
    Route::get('/bookmarks/{batchId}',         [YearbookController::class, 'getBookmarks']);
    Route::post('/bookmark',                   [YearbookController::class, 'addBookmark']);
    Route::delete('/bookmark/{bookmark}',      [YearbookController::class, 'removeBookmark']);
});