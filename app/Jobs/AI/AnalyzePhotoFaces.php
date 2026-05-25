<?php

namespace App\Jobs\AI;

use App\Contracts\FaceRecognition;
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
        public readonly Photo $photo,
        public readonly bool  $force = false,
    ) {}

    public function handle(FaceRecognition $faceRecognition): void
    {
        if (! $faceRecognition->isEnabled()) {
            Log::info("Face recognition disabled – skipping Photo #{$this->photo->id}");
            return;
        }

        if (! $this->force && $this->photo->taggedPhotos()->exists()) {
            Log::info("Photo #{$this->photo->id} already tagged – skipping");
            return;
        }

        try {
            $result    = $faceRecognition->analyzePhoto('public', $this->photo->file_path);
            $matches   = $result['matches']    ?? [];
            $faceCount = $result['face_count'] ?? 0;

            if (! empty($matches)) {
                if ($this->force) {
                    $this->photo->taggedPhotos()->where('source', 'rekognition')->delete();
                }

                foreach ($matches as $match) {
                    $userId = data_get($match, 'user_id');
                    if (blank($userId)) continue;

                    TaggedPhoto::updateOrCreate(
                        [
                            'photo_id' => $this->photo->id,
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

            $this->photo->update([
                'ai_metadata' => array_merge($this->photo->ai_metadata ?? [], [
                    'status'      => 'analyzed',
                    'provider'    => $result['provider'] ?? 'aws-rekognition',
                    'face_count'  => $faceCount,
                    'analyzed_at' => now()->toIso8601String(),
                ]),
            ]);

            Log::info("Photo #{$this->photo->id}: {$faceCount} face(s), " . count($matches) . " match(es).");

            event(new \App\Events\PhotoFacesAnalyzed($this->photo, $result));

        } catch (\Throwable $e) {
            Log::error("AnalyzePhotoFaces failed for Photo #{$this->photo->id}: {$e->getMessage()}");

            $this->photo->update([
                'ai_metadata' => array_merge($this->photo->ai_metadata ?? [], [
                    'status'      => 'error',
                    'error'       => $e->getMessage(),
                    'analyzed_at' => now()->toIso8601String(),
                ]),
            ]);

            throw $e; 
        }
    }
}