<?php

namespace App\Http\Controllers\API\Concerns;

use App\Jobs\AI\AutoTranscribeVideo;
use Illuminate\Support\Facades\Log;

/**
 * AutoTranscribesVideo
 * ─────────────────────────────────────────────────────────────
 * Drop into any controller that uploads video/audio to Cloudinary.
 * Call maybeQueueTranscription() after each successful upload.
 */
trait AutoTranscribesVideo
{
    /**
     * @param  array   $uploadResult  Needs 'secure_url' + 'public_id'
     * @param  string  $title
     * @param  int     $userId
     * @param  int|null $albumId      Pass the just-created Album's ID to link transcript → album
     */
    protected function maybeQueueTranscription(
        array  $uploadResult,
        string $title,
        int    $userId,
        ?int   $albumId = null,
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
            cloudinaryUrl: $url,
            publicId:      $publicId,
            title:         $title,
            uploadedBy:    $userId,
            albumId:       $albumId,
        );
    }
}