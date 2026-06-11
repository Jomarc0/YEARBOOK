<?php

namespace App\Observers;

use App\Jobs\AI\AnalyzePhotoFaces;
use App\Models\Photo;
use Illuminate\Support\Facades\App;

class PhotoObserver
{
    public function created(Photo $photo): void
    {
        $this->dispatchAnalysis($photo);
    }

    public function updated(Photo $photo): void
    {
        if ($photo->wasChanged('file_path')) {
            $this->dispatchAnalysis($photo, force: true);
        }
    }

    private function dispatchAnalysis(Photo $photo, bool $force = false): void
    {
        if (App::runningUnitTests()) return;

        // Skip videos  AWS Rekognition only supports images
        $resourceType = $photo->ai_metadata['resource_type'] ?? 'image';
        if ($resourceType === 'video') {
            return;
        }

        // 3-second delay lets storage finish writing before Rekognition reads it
        AnalyzePhotoFaces::dispatch($photo, $force)->delay(now()->addSeconds(3));
    }
}