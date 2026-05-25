<?php

namespace App\Contracts;

use App\Models\Transcript;

/**
 * TranscriptionServiceInterface
 * ──────────────────────────────────────────────────────────────
 * Contract for all speech-to-text integrations.
 * Current implementation: Groq Whisper (free, fast).
 *
 * To swap provider → change only IntegrationServiceProvider binding.
 */
interface TranscriptionServiceInterface
{
    /**
     * Whether the service is configured and ready to use.
     */
    public function isEnabled(): bool;

    /**
     * Transcribe the audio attached to a Transcript model.
     * Updates status, transcript_text, language, and segments in-place.
     *
     * @throws \RuntimeException  if API call fails or file not found
     */
    public function transcribe(Transcript $transcript): void;
}