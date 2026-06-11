<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\Yearbook\YearbookController;
use App\Http\Controllers\API\Yearbook\GalleryController;
use App\Http\Controllers\API\Yearbook\MediaController;
use App\Http\Controllers\API\Yearbook\AnnouncementController;
use App\Http\Controllers\API\Yearbook\GraduationController;
use App\Http\Controllers\API\Yearbook\YearbookPdfController;



Route::middleware(['auth:sanctum', 'check.consent'])->group(function () {

    // Core Yearbook 
    Route::prefix('yearbook')->name('yearbook.')->group(function () {

        Route::get('/', [YearbookController::class, 'index'])->name('index');
        Route::get('/batches', [YearbookController::class, 'batches'])->name('batches');

        // Flipbook data endpoint (React PageFlip) 
        Route::get('/flipbook/{batchId}', [YearbookPdfController::class, 'flipbookData'])
            ->name('flipbook.data');

        // PDF Export
        Route::get('/export/pdf/{batchId}', [YearbookPdfController::class, 'export'])
            ->name('export.pdf');

        // Gallery 
        Route::prefix('gallery')->name('gallery.')->group(function () {
            Route::get('/', [GalleryController::class, 'index'])->name('index');
            Route::get('/{album}', [GalleryController::class, 'show'])->name('show');
            Route::post('/', [GalleryController::class, 'store'])->name('store');
            Route::delete('/{album}', [GalleryController::class, 'destroy'])->name('destroy');
        });

        // Media 
        Route::prefix('media')->name('media.')->group(function () {
            Route::post('/upload', [MediaController::class, 'upload'])->name('upload');
            Route::post('/bulk-upload', [MediaController::class, 'bulkUpload'])->name('bulk-upload');
            Route::delete('/{media}', [MediaController::class, 'destroy'])->name('destroy');
        });

        // Graduation 
        Route::prefix('graduation')->name('graduation.')->group(function () {
            Route::get('/', [GraduationController::class, 'index'])->name('index');
            Route::get('/archive', [GraduationController::class, 'archive'])->name('archive');
            Route::get('/speeches', [GraduationController::class, 'speeches'])->name('speeches');
            Route::post('/', [GraduationController::class, 'store'])->name('store');
        });

        // Announcements
        Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    });
});