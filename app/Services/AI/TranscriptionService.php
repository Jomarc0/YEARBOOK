<?php

namespace App\Services\AI;

use App\Contracts\TranscriptionServiceInterface;
use App\Models\Transcript;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * TranscriptionService  (Groq Whisper + Groq LLM)
 * ──────────────────────────────────────────────────────────────
 * Features:
 *   1. transcribe()       → full transcript text + segments
 *   2. generateSubtitles()→ SRT or VTT string from segments
 *   3. generateNotes()    → AI speech notes via Groq LLM
 *
 * .env keys:
 *   GROQ_API_KEY=gsk_...
 *   GROQ_WHISPER_MODEL=whisper-large-v3-turbo
 *   GROQ_NOTES_MODEL=llama-3.3-70b-versatile
 */
class TranscriptionService implements TranscriptionServiceInterface
{
    private string $apiKey;
    private string $whisperModel;
    private string $notesModel;

    private string $whisperUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
    private string $chatUrl    = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey       = (string) config('services.groq.key',         '');
        $this->whisperModel = (string) config('services.groq.model',       'whisper-large-v3-turbo');
        $this->notesModel   = (string) config('services.groq.notes_model', 'llama-3.3-70b-versatile');
    }

    // ── Contract: isEnabled ───────────────────────────────────────────────

    public function isEnabled(): bool
    {
        return filled($this->apiKey);
    }

    // ── Feature 1: Transcript generation ─────────────────────────────────

    public function transcribe(Transcript $transcript): void
    {
        if (! $this->isEnabled()) {
            Log::warning('TranscriptionService: GROQ_API_KEY not configured.');
            $transcript->update(['status' => 'failed']);
            return;
        }

        $transcript->update(['status' => 'processing']);

        try {
            $audioUrl = $transcript->audio_path;   // ← now a full Cloudinary URL

            if (blank($audioUrl)) {
                throw new \RuntimeException('No audio URL found on transcript.');
            }

            // ── Fetch audio bytes from Cloudinary ─────────────────────────────
            $context = stream_context_create([
                'http' => ['timeout' => 30, 'follow_location' => true],
                'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
            ]);

            $audioBytes = @file_get_contents($audioUrl, false, $context);

            if ($audioBytes === false || $audioBytes === '') {
                throw new \RuntimeException("Could not fetch audio from Cloudinary: {$audioUrl}");
            }

            // Check 25 MB Groq limit
            $fileSizeMb = strlen($audioBytes) / 1024 / 1024;
            if ($fileSizeMb > 25) {
                throw new \RuntimeException(
                    "Audio file {$fileSizeMb} MB exceeds Groq's 25 MB limit."
                );
            }

            // ── Get filename + extension for Groq ─────────────────────────────
            // Groq needs the filename to detect format
            $filename = basename(parse_url($audioUrl, PHP_URL_PATH));
            if (! pathinfo($filename, PATHINFO_EXTENSION)) {
                $filename .= '.mp3';   // fallback extension
            }

            // ── Write bytes to a temp file (Groq needs a real file handle) ────
            $tmpPath = tempnam(sys_get_temp_dir(), 'groq_audio_') . '.' . pathinfo($filename, PATHINFO_EXTENSION);
            file_put_contents($tmpPath, $audioBytes);

            try {
                // ── Call Groq Whisper ─────────────────────────────────────────
                $response = Http::withToken($this->apiKey)
                    ->timeout(300)
                    ->attach('file', fopen($tmpPath, 'r'), $filename)
                    ->post($this->whisperUrl, [
                        'model'           => $this->whisperModel,
                        'response_format' => 'verbose_json',
                        'temperature'     => 0,
                    ]);
            } finally {
                @unlink($tmpPath);   // always clean up temp file
            }

            if ($response->failed()) {
                $error = $response->json('error.message') ?? $response->body();
                throw new \RuntimeException("Groq Whisper error: {$error}");
            }

            $data     = $response->json();
            $segments = $this->normalizeSegments($data['segments'] ?? []);
            $text     = $data['text'] ?? '';

            // ── Generate notes via Groq LLaMA ─────────────────────────────────
            $notes = null;
            try {
                $notes = $this->generateNotes($text, $transcript->title);
            } catch (\Throwable $e) {
                Log::warning("Notes generation failed for #{$transcript->id}: {$e->getMessage()}");
            }

            $transcript->update([
                'transcript_text' => $text,
                'language'        => $data['language'] ?? null,
                'segments'        => $segments,
                'notes'           => $notes,
                'status'          => 'done',
            ]);

            Log::info("Transcript #{$transcript->id} done. Lang: {$transcript->language}.");

        } catch (\Throwable $e) {
            Log::error("TranscriptionService failed for #{$transcript->id}: {$e->getMessage()}");
            $transcript->update(['status' => 'failed']);
            throw $e;
        }
    }

    // ── Feature 2: Subtitle generation ───────────────────────────────────

    /**
     * Generate subtitle file content from stored segments.
     *
     * @param  Transcript $transcript
     * @param  string     $format  'srt' | 'vtt'
     * @return string     Raw subtitle file content
     */
    public function generateSubtitles(Transcript $transcript, string $format = 'srt'): string
    {
        $segments = $transcript->segments ?? [];

        if (empty($segments)) {
            throw new \RuntimeException('No segments available. Transcribe the audio first.');
        }

        return match ($format) {
            'vtt' => $this->toVtt($segments),
            default => $this->toSrt($segments),
        };
    }

    // ── Feature 3: Speech notes (AI summary) ─────────────────────────────

    /**
     * Generate speech notes using Groq LLM (llama).
     * Returns structured notes: summary, key points, notable quotes.
     *
     * @param  string $transcriptText  Full transcript text
     * @param  string $title           Speech title for context
     * @return string|null             Formatted notes or null on failure
     */
    public function generateNotes(string $transcriptText, string $title = ''): ?string
    {
        if (! $this->isEnabled() || blank($transcriptText)) {
            return null;
        }

        $prompt = <<<PROMPT
You are analyzing a graduation speech titled "{$title}".

Given this speech transcript, produce structured speech notes in this exact format:

## Summary
(2-3 sentence overview of the speech)

## Key Points
- (main point 1)
- (main point 2)
- (main point 3)
- (add more if needed)

## Notable Quotes
- "(direct quote from speech)"
- "(another notable quote)"

## Themes
(1-2 sentence description of the central themes)

Transcript:
{$transcriptText}
PROMPT;

        $response = Http::withToken($this->apiKey)
            ->timeout(60)
            ->post($this->chatUrl, [
                'model'       => $this->notesModel,
                'temperature' => 0.3,
                'max_tokens'  => 1024,
                'messages'    => [
                    [
                        'role'    => 'system',
                        'content' => 'You are a helpful assistant that creates concise, structured speech notes for academic events. Be accurate and professional.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

        if ($response->failed()) {
            $error = $response->json('error.message') ?? $response->body();
            throw new \RuntimeException("Groq LLM error: {$error}");
        }

        return $response->json('choices.0.message.content');
    }

    // ── Private: subtitle converters ──────────────────────────────────────

    /**
     * Convert segments array to SRT format.
     *
     * Example output:
     *   1
     *   00:00:00,000 --> 00:00:04,500
     *   Good morning, graduates and guests.
     */
    private function toSrt(array $segments): string
    {
        $output = '';

        foreach ($segments as $i => $seg) {
            $index = $i + 1;
            $start = $this->secondsToSrtTime((float) $seg['start']);
            $end   = $this->secondsToSrtTime((float) $seg['end']);
            $text  = trim($seg['text'] ?? '');

            $output .= "{$index}\n{$start} --> {$end}\n{$text}\n\n";
        }

        return trim($output);
    }

    /**
     * Convert segments array to WebVTT format.
     *
     * Example output:
     *   WEBVTT
     *
     *   00:00:00.000 --> 00:00:04.500
     *   Good morning, graduates and guests.
     */
    private function toVtt(array $segments): string
    {
        $output = "WEBVTT\n\n";

        foreach ($segments as $seg) {
            $start = $this->secondsToVttTime((float) $seg['start']);
            $end   = $this->secondsToVttTime((float) $seg['end']);
            $text  = trim($seg['text'] ?? '');

            $output .= "{$start} --> {$end}\n{$text}\n\n";
        }

        return trim($output);
    }

    /** 83.5s → "00:01:23,500"  (SRT uses comma for milliseconds) */
    private function secondsToSrtTime(float $seconds): string
    {
        $ms   = (int) round(($seconds - floor($seconds)) * 1000);
        $s    = (int) $seconds % 60;
        $m    = (int) ($seconds / 60) % 60;
        $h    = (int) ($seconds / 3600);

        return sprintf('%02d:%02d:%02d,%03d', $h, $m, $s, $ms);
    }

    /** 83.5s → "00:01:23.500"  (VTT uses dot for milliseconds) */
    private function secondsToVttTime(float $seconds): string
    {
        return str_replace(',', '.', $this->secondsToSrtTime($seconds));
    }

    /** Normalize Groq segments into a clean shape. */
    private function normalizeSegments(array $segments): array
    {
        return collect($segments)->map(fn (array $seg) => [
            'id'    => $seg['id']   ?? 0,
            'start' => round((float) ($seg['start'] ?? 0), 2),
            'end'   => round((float) ($seg['end']   ?? 0), 2),
            'text'  => trim($seg['text'] ?? ''),
        ])->values()->all();
    }
}