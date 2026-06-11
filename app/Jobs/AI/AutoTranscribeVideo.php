<?php

namespace App\Jobs\AI;

use App\Models\Transcript;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AutoTranscribeVideo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 30;

    public function __construct(
        public readonly string $cloudinaryUrl,
        public readonly string $publicId,
        public readonly string $title,
        public readonly int    $uploadedBy,
        public readonly ?int   $albumId           = null,  
        public readonly ?int   $graduationPhotoId = null,  
    ) {}

    public function handle(): void
    {
        if (Transcript::where('public_id', $this->publicId)->exists()) {
            Log::info("AutoTranscribeVideo: transcript already exists for [{$this->publicId}], skipping.");
            return;
        }

        $transcript = Transcript::create([
            'title'               => $this->title,
            'audio_path'          => $this->cloudinaryUrl,
            'public_id'           => $this->publicId,
            'status'              => 'pending',
            'source'              => 'auto',
            'album_id'            => $this->graduationPhotoId ? null : $this->albumId,
            'graduation_photo_id' => $this->graduationPhotoId,  
            'uploaded_by'         => $this->uploadedBy,
        ]);

        Log::info("AutoTranscribeVideo: created Transcript #{$transcript->id} for [{$this->publicId}].", [
            'album_id'            => $this->graduationPhotoId ? null : $this->albumId,
            'graduation_photo_id' => $this->graduationPhotoId,
        ]);

        GenerateTranscript::dispatch($transcript);
    }

    public function failed(\Throwable $e): void
    {
        Log::error(
            "AutoTranscribeVideo: failed to create transcript for [{$this->publicId}]: " .
            $e->getMessage()
        );
    }
}
