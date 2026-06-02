<?php

namespace App\Jobs\AI;

use App\Contracts\AnalyzablePhoto;
use App\Contracts\FaceRecognition;
use App\Events\PhotoFacesAnalyzed;
use App\Models\TaggedPhoto;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzePhotoFaces implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 30;
    public int $timeout = 300;

    public function __construct(
        public readonly AnalyzablePhoto $photo,
        public readonly bool            $force = false,
    ) {}

    public function handle(FaceRecognition $faceRecognition): void
    {
        /** @var \Illuminate\Database\Eloquent\Model&AnalyzablePhoto $photo */
        $photo = $this->photo;

        if (! $faceRecognition->isEnabled()) {
            Log::info("Face recognition disabled – skipping Photo #{$photo->getKey()}");
            return;
        }

        if (! $this->force && $photo->taggedPhotos()->exists()) {
            Log::info("Photo #{$photo->getKey()} already tagged – skipping");
            return;
        }

        try {
            $filePath = $photo->getAttribute('file_path');

            $faceRecognition->indexPhoto($filePath, 'photo:' . $photo->getKey());

            $result    = $faceRecognition->analyzePhoto('public', $filePath);
            $matches   = $result['matches']    ?? [];
            $faceCount = $result['face_count'] ?? 0;

            if (! empty($matches)) {
                if ($this->force) {
                    $photo->taggedPhotos()->where('source', 'rekognition')->delete();
                }

                foreach ($matches as $match) {
                    $userId = data_get($match, 'user_id');
                    if (blank($userId)) continue;

                    TaggedPhoto::updateOrCreate(
                        [
                            'photo_id' => $photo->getKey(),
                            'user_id'  => (int) $userId,
                            'source'   => 'rekognition',
                        ],
                        [
                            'similarity' => (float) data_get($match, 'similarity', 0),
                            'confidence' => (float) data_get($match, 'confidence', 0),
                            'tagged_by'  => null,
                        ]
                    );
                }
            }

            $photo->markAiDone([
                'provider'    => $result['provider'] ?? 'aws-rekognition',
                'face_count'  => $faceCount,
                'analyzed_at' => now()->toIso8601String(),
            ]);

            Log::info("Photo #{$photo->getKey()}: {$faceCount} face(s), " . count($matches) . ' match(es).');

            event(new \App\Events\PhotoFacesAnalyzed($this->photo, $result));

        } catch (\Throwable $e) {
            Log::error("AnalyzePhotoFaces failed for Photo #{$photo->getKey()}: {$e->getMessage()}");
            $photo->markAiError($e->getMessage());
        }
    }
}