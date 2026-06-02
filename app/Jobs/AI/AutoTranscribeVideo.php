<?php

namespace App\Jobs\AI;

use App\Models\Transcript;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * AutoTranscribeVideo
 * ─────────────────────────────────────────────────────────────
 * Fired after any graduation video/audio upload.
 * Creates a Transcript record (source = 'auto', linked to the Album)
 * and chains into the existing GenerateTranscript job.
 *
 * Idempotent: skips if a Transcript for this public_id already exists.
 */
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
        public readonly ?int   $albumId = null,   // FK → albums.id
    ) {}

    public function handle(): void
    {
        if (Transcript::where('public_id', $this->publicId)->exists()) {
            Log::info("AutoTranscribeVideo: transcript already exists for [{$this->publicId}], skipping.");
            return;
        }

        $transcript = Transcript::create([
            'title'       => $this->title,
            'audio_path'  => $this->cloudinaryUrl,
            'public_id'   => $this->publicId,
            'status'      => 'pending',
            'source'      => 'auto',            // visible to all premium users via visibleTo() scope
            'album_id'    => $this->albumId,    // links transcript back to its graduation video
            'uploaded_by' => $this->uploadedBy,
        ]);

        Log::info("AutoTranscribeVideo: created Transcript #{$transcript->id} for [{$this->publicId}].", [
            'album_id' => $this->albumId,
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