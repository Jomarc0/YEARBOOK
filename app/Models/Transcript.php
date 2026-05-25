<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Transcript extends Model
{
    protected $fillable = [
        'title',
        'audio_path',  
        'public_id',   
        'transcript_text',
        'segments',
        'language',
        'notes',
        'status',
        'uploaded_by',
    ];

    protected $casts = [
        'segments' => 'array',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    /** Filter by status */
    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /** Searchable speeches — searches title, transcript_text, and notes */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title',           'like', "%{$term}%")
              ->orWhere('transcript_text', 'like', "%{$term}%")
              ->orWhere('notes',           'like', "%{$term}%");
        });
    }

    /** Only done transcripts (has transcript text) */
    public function scopeDone(Builder $query): Builder
    {
        return $query->where('status', 'done');
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    /** Duration in seconds from last segment end time */
    public function getDurationAttribute(): ?float
    {
        $segments = $this->segments;
        if (empty($segments)) return null;

        return (float) collect($segments)->last()['end'] ?? null;
    }

    /** Human-readable duration e.g. "5:32" */
    public function getDurationFormattedAttribute(): ?string
    {
        $duration = $this->duration;
        if ($duration === null) return null;

        $minutes = (int) ($duration / 60);
        $seconds = (int) ($duration % 60);

        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /** Word count of the transcript */
    public function getWordCountAttribute(): int
    {
        return str_word_count($this->transcript_text ?? '');
    }

    /** Whether subtitle data is available */
    public function getHasSubtitlesAttribute(): bool
    {
        return ! empty($this->segments);
    }

    /** Whether AI notes have been generated */
    public function getHasNotesAttribute(): bool
    {
        return filled($this->notes);
    }
}