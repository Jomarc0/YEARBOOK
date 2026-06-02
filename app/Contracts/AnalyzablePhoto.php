<?php

namespace App\Contracts;

/**
 * @mixin \Illuminate\Database\Eloquent\Model
 */
interface AnalyzablePhoto
{
    public function markAiQueued(): bool;
    public function markAiDone(array $results = []): bool;
    public function markAiError(string $message): bool;
}