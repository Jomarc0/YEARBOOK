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
        'source',       // 'manual' | 'auto'
        'album_id',     // nullable FK → albums.id
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

    /** The graduation Album this transcript was auto-generated from (nullable). */
    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
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
            $q->where('title',            'like', "%{$term}%")
              ->orWhere('transcript_text', 'like', "%{$term}%")
              ->orWhere('notes',           'like', "%{$term}%");
        });
    }

    /** Only done transcripts */
    public function scopeDone(Builder $query): Builder
    {
        return $query->where('status', 'done');
    }

    /**
     * Transcripts visible to a given user:
     *   - Their own manually-uploaded transcripts (any status)
     *   - All auto-generated transcripts with status 'done' (visible to every premium user)
     */
    public function scopeVisibleTo(Builder $query, int $userId): Builder
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('uploaded_by', $userId)                 // own manual uploads
              ->orWhere(fn ($q2) => $q2                       // all auto-transcripts that are done
                  ->where('source', 'auto')
                  ->where('status', 'done')
              );
        });
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getDurationAttribute(): ?float
    {
        $segments = $this->segments;
        if (empty($segments)) return null;
        return (float) collect($segments)->last()['end'] ?? null;
    }

    public function getDurationFormattedAttribute(): ?string
    {
        $duration = $this->duration;
        if ($duration === null) return null;
        $minutes = (int) ($duration / 60);
        $seconds = (int) ($duration % 60);
        return sprintf('%d:%02d', $minutes, $seconds);
    }

    public function getWordCountAttribute(): int
    {
        return str_word_count($this->transcript_text ?? '');
    }

    public function getHasSubtitlesAttribute(): bool
    {
        return ! empty($this->segments);
    }

    public function getHasNotesAttribute(): bool
    {
        return filled($this->notes);
    }
}