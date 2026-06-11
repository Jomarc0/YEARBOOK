<?php

namespace App\Http\Controllers\API\Concerns;

use App\Jobs\AI\AutoTranscribeVideo;
use Illuminate\Support\Facades\Log;


trait AutoTranscribesVideo
{

    protected function maybeQueueTranscription(
        array  $uploadResult,
        string $title,
        int    $userId,
        ?int   $albumId           = null,
        ?int   $graduationPhotoId = null,  
    ): void {
        if (blank(config('services.groq.key'))) {
            return;
        }

        $url      = $uploadResult['secure_url'] ?? '';
        $publicId = $uploadResult['public_id']  ?? '';

        if (blank($url) || blank($publicId)) {
            Log::warning('AutoTranscribesVideo: missing secure_url or public_id — skipping.', [
                'upload_result' => $uploadResult,
            ]);
            return;
        }

        AutoTranscribeVideo::dispatch(
            cloudinaryUrl:      $url,
            publicId:           $publicId,
            title:              $title,
            uploadedBy:         $userId,
            albumId:            $albumId,
            graduationPhotoId:  $graduationPhotoId, 
        );
    }
}