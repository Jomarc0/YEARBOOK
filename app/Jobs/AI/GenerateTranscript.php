<?php

namespace App\Jobs\AI;

use App\Contracts\TranscriptionServiceInterface;
use App\Models\Transcript;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GenerateTranscript
 * ─────────────────────────────────────────────────────────────
 * Dispatched by TranscriptController::store() after audio upload.
 * Calls Groq Whisper via TranscriptionService and persists result.
 *
 * Dispatch:
 *   GenerateTranscript::dispatch($transcript);
 *
 * Queue: default (or set QUEUE_CONNECTION=database in .env)
 */
class GenerateTranscript implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 300;   // 5 min — long speeches may take a while
    public int $backoff = 60;    // retry after 60s on failure

    public function __construct(
        public readonly Transcript $transcript
    ) {}

    public function handle(TranscriptionServiceInterface $service): void
    {
        if (! $service->isEnabled()) {
            Log::warning("GenerateTranscript: service disabled — skipping #{$this->transcript->id}.");
            $this->transcript->update(['status' => 'failed']);
            return;
        }

        $service->transcribe($this->transcript);
    }

    public function failed(\Throwable $e): void
    {
        Log::error(
            "GenerateTranscript permanently failed for #{$this->transcript->id}: " .
            $e->getMessage()
        );

        // Mark as failed so the UI shows the error state
        $this->transcript->update(['status' => 'failed']);
    }
}