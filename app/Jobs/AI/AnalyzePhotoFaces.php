<?php

namespace App\Jobs\AI;

use App\Contracts\AnalyzablePhoto;
use App\Contracts\FaceRecognition;
use App\Models\Gallery;
use App\Models\GraduationPhoto;
use App\Models\Photo;
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

        if (! $this->force && method_exists($photo, 'taggedPhotos') && $photo->taggedPhotos()->exists()) {
            Log::info("Photo #{$photo->getKey()} already tagged – skipping");
            return;
        }

        try {
            [$filePath, $externalImageId] = $this->photoSource($photo);

            $faceRecognition->indexPhoto($filePath, $externalImageId);

            $result    = $faceRecognition->analyzePhoto('public', $filePath);
            $matches   = $result['matches']    ?? [];
            $faceCount = $result['face_count'] ?? 0;

            if (! empty($matches)) {
                if ($this->force && method_exists($photo, 'taggedPhotos')) {
                    $photo->taggedPhotos()->where('source', 'rekognition')->delete();
                }

                foreach ($matches as $match) {
                    $userId = data_get($match, 'user_id');
                    if (blank($userId)) continue;
                    if (! method_exists($photo, 'taggedPhotos')) continue;

                    $photoKey = $photo instanceof GraduationPhoto ? 'graduation_photo_id' : 'photo_id';

                    TaggedPhoto::updateOrCreate(
                        [
                            $photoKey => $photo->getKey(),
                            'user_id' => (int) $userId,
                            'source'  => 'rekognition',
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
                'matches'     => $matches,
                'analyzed_at' => now()->toIso8601String(),
            ]);

            Log::info("Photo #{$photo->getKey()}: {$faceCount} face(s), " . count($matches) . ' match(es).');

            event(new \App\Events\PhotoFacesAnalyzed($this->photo, $result));

        } catch (\Throwable $e) {
            Log::error("AnalyzePhotoFaces failed for Photo #{$photo->getKey()}: {$e->getMessage()}");
            $photo->markAiError($e->getMessage());
        }
    }

    private function photoSource(AnalyzablePhoto $photo): array
    {
        if ($photo instanceof Gallery) {
            $media = $photo->media()
                ->where('resource_type', 'image')
                ->orderBy('sort_order')
                ->first();

            if (! $media) {
                throw new \RuntimeException("Gallery #{$photo->getKey()} has no image media to analyze.");
            }

            return [$media->file_path, 'gallery_media:' . $media->getKey()];
        }

        if ($photo instanceof GraduationPhoto) {
            return [$photo->file_path, 'graduation_photo:' . $photo->getKey()];
        }

        if ($photo instanceof Photo) {
            return [$photo->file_path, 'photo:' . $photo->getKey()];
        }

        throw new \RuntimeException('Unsupported photo model for face analysis.');
    }
}
