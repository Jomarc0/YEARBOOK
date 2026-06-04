<?php

/**
 * Sinag-Bughaw — Settings routes & seeder reference
 *
 * Student app (public):
 *   GET /api/app-config
 *
 * Admin routes in routes/api.php inside:
 *   Route::middleware(['auth:sanctum', 'admin.only'])->prefix('admin')->group(...)
 *
 * Apply migration before archive-batch:
 *   php artisan migrate
 */

// ─── Public app config (student web) ─────────────────────────────────────────

Route::get('/app-config', [AppConfigController::class, 'show']);

// ─── Admin settings (already applied in routes/api.php) ────────────────────

Route::prefix('settings')->group(function () {
    Route::get('/',                    [SettingsController::class, 'index']);
    Route::post('/',                   [SettingsController::class, 'save']);
    Route::delete('/clear-audit-logs', [SettingsController::class, 'clearAuditLogs']);
    Route::post('/reset',              [SettingsController::class, 'reset']);
    Route::post('/archive-batch',      [SettingsController::class, 'archiveBatch']);
});

// ─── Seeder pattern (database/seeders/SettingsSeeder.php) ─────────────────────
//
// foreach ($defaults as $key => $value) {
//     Setting::query()->firstOrCreate(
//         ['key' => $key],
//         ['value' => $value]
//     );
// }
//
// Re-running the seeder only inserts missing keys; it never overwrites
// values customized by admins in production.
