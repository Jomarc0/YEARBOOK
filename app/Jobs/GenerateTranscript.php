<?php

namespace App\Jobs;

use App\Models\Transcript;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateTranscript implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries   = 2;

    public function __construct(public Transcript $transcript) {}

    public function handle(): void
    {
        $this->transcript->update(['status' => 'processing']);

        try {
            $audioContent = Storage::disk('public')->get($this->transcript->audio_path);
            $filename     = basename($this->transcript->audio_path);
            $url          = config('services.whisper_service.url') . '/transcribe';

            $response = Http::timeout(280)
                ->attach('audio', $audioContent, $filename)
                ->post($url);

            if ($response->failed()) {
                throw new \RuntimeException('Whisper error: ' . $response->body());
            }

            $data = $response->json();

            $this->transcript->update([
                'status'          => 'done',
                'transcript_text' => $data['text'] ?? '',
                'language'        => $data['language'] ?? 'en',
                'segments'        => $data['segments'] ?? [],
            ]);

        } catch (\Exception $e) {
            $this->transcript->update(['status' => 'failed']);
            Log::error("Transcript failed ID {$this->transcript->id}: " . $e->getMessage());
            throw $e;
        }
    }
}