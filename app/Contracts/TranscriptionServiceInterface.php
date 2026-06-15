<?php

namespace App\Contracts;

use App\Models\Transcript;

/**
 * TranscriptionServiceInterface
 * Contract for all speech-to-text integrations.
 * Current implementation: Groq Whisper (free, fast).
 *
 * Features:
 * 1. isEnabled() check if service is configured
 * 2. transcribe() generate transcript + notes from audio
 * 3. generateSubtitles() convert segments to SRT / VTT
 * 4. generateNotes() AI speech notes via Groq LLM
 */
interface TranscriptionServiceInterface
{
    public function isEnabled(): bool;

    /**
     * Transcribe audio + generate speech notes.
     */
    public function transcribe(Transcript $transcript): void;

    /**
     * Generate SRT or VTT subtitle file content from stored segments.
     */
    public function generateSubtitles(Transcript $transcript, string $format = 'srt'): string;

    /**
     * Generate AI speech notes (summary, key points, quotes, themes).
     */
    public function generateNotes(string $transcriptText, string $title = ''): ?string;
}