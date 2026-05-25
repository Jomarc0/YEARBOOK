<?php

namespace App\Contracts;

use App\Models\Transcript;

/**
 * TranscriptionServiceInterface
 * ──────────────────────────────────────────────────────────────
 * Contract for all speech-to-text integrations.
 * Current implementation: Groq Whisper (free, fast).
 *
 * Features:
 *   1. isEnabled()         → check if service is configured
 *   2. transcribe()        → generate transcript + notes from audio
 *   3. generateSubtitles() → convert segments to SRT / VTT
 *   4. generateNotes()     → AI speech notes via Groq LLM
 */
interface TranscriptionServiceInterface
{
    /** Whether the service is configured and ready to use. */
    public function isEnabled(): bool;

    /**
     * Transcribe audio + generate speech notes.
     * Updates status, transcript_text, language, segments, notes in-place.
     *
     * @throws \RuntimeException if API call fails or file not found
     */
    public function transcribe(Transcript $transcript): void;

    /**
     * Generate SRT or VTT subtitle file content from stored segments.
     *
     * @param  string $format 'srt' | 'vtt'
     * @return string Raw subtitle file content
     * @throws \RuntimeException if no segments exist
     */
    public function generateSubtitles(Transcript $transcript, string $format = 'srt'): string;

    /**
     * Generate AI speech notes (summary, key points, quotes, themes).
     *
     * @param  string $transcriptText Full transcript text
     * @param  string $title          Speech title for context
     * @return string|null            Formatted notes or null on failure
     */
    public function generateNotes(string $transcriptText, string $title = ''): ?string;
}