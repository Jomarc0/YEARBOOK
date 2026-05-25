<?php

namespace App\Observers;

use App\Jobs\AI\AnalyzePhotoFaces;
use App\Models\Photo;
use Illuminate\Support\Facades\App;

/**
 * PhotoObserver
 * ─────────────────────────────────────────────────────────────
 * Automatically queues face analysis when a Photo is uploaded.
 *
 * Register in App\Providers\AppServiceProvider::boot():
 *
 *   use App\Models\Photo;
 *   use App\Observers\PhotoObserver;
 *
 *   Photo::observe(PhotoObserver::class);
 */
class PhotoObserver
{
    /**
     * New photo uploaded → queue analysis.
     */
    public function created(Photo $photo): void
    {
        $this->dispatchAnalysis($photo);
    }

    /**
     * Photo file replaced → re-analyze.
     */
    public function updated(Photo $photo): void
    {
        if ($photo->wasChanged('file_path')) {
            $this->dispatchAnalysis($photo, force: true);
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    private function dispatchAnalysis(Photo $photo, bool $force = false): void
    {
        if (App::runningUnitTests()) return;

        // 3-second delay lets storage finish writing before Rekognition reads it
        AnalyzePhotoFaces::dispatch($photo, $force)->delay(now()->addSeconds(3));
    }
}