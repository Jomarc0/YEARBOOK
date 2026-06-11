<?php

namespace App\Services\AI;

use App\Contracts\TranscriptionServiceInterface;
use App\Models\Transcript;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranscriptionService implements TranscriptionServiceInterface
{
    private string $apiKey;
    private string $whisperModel;
    private string $notesModel;

    private const GROQ_LIMIT_BYTES = 25 * 1024 * 1024; // 25 MB

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

    // Feature 1: Transcript generation 

    public function transcribe(Transcript $transcript): void
    {
        if (! $this->isEnabled()) {
            Log::warning('TranscriptionService: GROQ_API_KEY not configured.');
            $transcript->update(['status' => 'failed']);
            return;
        }

        $transcript->update(['status' => 'processing']);

        try {
            $audioUrl = $transcript->audio_path;

            if (blank($audioUrl)) {
                throw new \RuntimeException('No audio URL found on transcript.');
            }

            // Fetch media bytes from Cloudinary 
            $context = stream_context_create([
                'http' => ['timeout' => 60, 'follow_location' => true],
                'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
            ]);

            $mediaBytes = @file_get_contents($audioUrl, false, $context);

            if ($mediaBytes === false || $mediaBytes === '') {
                throw new \RuntimeException("Could not fetch media from Cloudinary: {$audioUrl}");
            }

            $fileSizeBytes = strlen($mediaBytes);

            // Write to temp file 
            $ext      = pathinfo(parse_url($audioUrl, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'mp4';
            $tmpMedia = tempnam(sys_get_temp_dir(), 'groq_media_') . '.' . $ext;
            file_put_contents($tmpMedia, $mediaBytes);
            unset($mediaBytes); // free memory

            // Extract audio if file exceeds Groq 25 MB limit 
            [$tmpAudio, $audioFilename] = $fileSizeBytes > self::GROQ_LIMIT_BYTES
                ? $this->extractAudio($tmpMedia)
                : [$tmpMedia, basename($tmpMedia)];

            try {
                //Verify extracted/original file is within limit 
                $audioSize = filesize($tmpAudio);
                if ($audioSize > self::GROQ_LIMIT_BYTES) {
                    throw new \RuntimeException(
                        "Audio track ({$this->formatBytes($audioSize)}) still exceeds Groq's 25 MB limit " .
                        "after extraction. File may be too long."
                    );
                }

                // Call Groq Whisper 
                $response = Http::withToken($this->apiKey)
                    ->timeout(300)
                    ->attach('file', fopen($tmpAudio, 'r'), $audioFilename)
                    ->post($this->whisperUrl, [
                        'model'           => $this->whisperModel,
                        'response_format' => 'verbose_json',
                        'temperature'     => 0,
                    ]);
            } finally {
                @unlink($tmpMedia);
                // Only unlink tmpAudio separately if ffmpeg created a different file
                if ($tmpAudio !== $tmpMedia) {
                    @unlink($tmpAudio);
                }
            }

            if ($response->failed()) {
                $error = $response->json('error.message') ?? $response->body();
                throw new \RuntimeException("Groq Whisper error: {$error}");
            }

            $data     = $response->json();
            $segments = $this->normalizeSegments($data['segments'] ?? []);
            $text     = $data['text'] ?? '';

            // Generate notes via Groq LLaMA
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

    // Feature 2: Subtitle generation 

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

    // Feature 3: Speech notes (AI summary)

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

    // Private: ffmpeg audio extraction─

    /**
     * Extract a mono 16 kHz MP3 audio track from a video file using ffmpeg.
     * Returns [tmpAudioPath, filename] — caller must unlink tmpAudioPath.
     *
     */
    private function extractAudio(string $videoPath): array
    {
        $ffmpeg = $this->findFfmpeg();

        $tmpAudio = tempnam(sys_get_temp_dir(), 'groq_audio_') . '.mp3';

        $cmd = sprintf(
            '%s -y -i %s -vn -acodec libmp3lame -ar 16000 -ac 1 -b:a 64k %s 2>&1',
            escapeshellarg($ffmpeg),
            escapeshellarg($videoPath),
            escapeshellarg($tmpAudio),
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0 || ! file_exists($tmpAudio) || filesize($tmpAudio) === 0) {
            @unlink($tmpAudio);
            throw new \RuntimeException(
                "ffmpeg audio extraction failed (exit {$exitCode}): " . implode("\n", array_slice($output, -5))
            );
        }

        $extractedSize = filesize($tmpAudio);
        Log::info("TranscriptionService: extracted audio track", [
            'original_path' => $videoPath,
            'audio_path'    => $tmpAudio,
            'audio_size'    => $this->formatBytes($extractedSize),
        ]);

        return [$tmpAudio, 'audio.mp3'];
    }

    /**
     * Locate the ffmpeg binary.
     */
    private function findFfmpeg(): string
    {
        $candidates = [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/opt/homebrew/bin/ffmpeg',
        ];

        foreach ($candidates as $path) {
            if (is_executable($path)) {
                return $path;
            }
        }

        // Try PATH
        $which = trim((string) shell_exec('which ffmpeg 2>/dev/null'));
        if ($which && is_executable($which)) {
            return $which;
        }

        throw new \RuntimeException(
            'ffmpeg is not installed or not in PATH. ' .
            'Install it with: apt-get install ffmpeg  (or brew install ffmpeg on Mac).'
        );
    }

    // Private: subtitle converters 

    private function toSrt(array $segments): string
    {
        $output = '';
        foreach ($segments as $i => $seg) {
            $index  = $i + 1;
            $start  = $this->secondsToSrtTime((float) $seg['start']);
            $end    = $this->secondsToSrtTime((float) $seg['end']);
            $text   = trim($seg['text'] ?? '');
            $output .= "{$index}\n{$start} --> {$end}\n{$text}\n\n";
        }
        return trim($output);
    }

    private function toVtt(array $segments): string
    {
        $output = "WEBVTT\n\n";
        foreach ($segments as $seg) {
            $start  = $this->secondsToVttTime((float) $seg['start']);
            $end    = $this->secondsToVttTime((float) $seg['end']);
            $text   = trim($seg['text'] ?? '');
            $output .= "{$start} --> {$end}\n{$text}\n\n";
        }
        return trim($output);
    }

    private function secondsToSrtTime(float $seconds): string
    {
        $ms = (int) round(($seconds - floor($seconds)) * 1000);
        $s  = (int) $seconds % 60;
        $m  = (int) ($seconds / 60) % 60;
        $h  = (int) ($seconds / 3600);
        return sprintf('%02d:%02d:%02d,%03d', $h, $m, $s, $ms);
    }

    private function secondsToVttTime(float $seconds): string
    {
        return str_replace(',', '.', $this->secondsToSrtTime($seconds));
    }

    private function normalizeSegments(array $segments): array
    {
        return collect($segments)->map(fn (array $seg) => [
            'id'    => $seg['id']   ?? 0,
            'start' => round((float) ($seg['start'] ?? 0), 2),
            'end'   => round((float) ($seg['end']   ?? 0), 2),
            'text'  => trim($seg['text'] ?? ''),
        ])->values()->all();
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i     = 0;
        $value = (float) $bytes;
        while ($value >= 1024 && $i < count($units) - 1) {
            $value /= 1024;
            $i++;
        }
        return round($value, 2) . ' ' . $units[$i];
    }
}