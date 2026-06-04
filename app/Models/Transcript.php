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
        'source',               // 'manual' | 'auto'
        'album_id',             // nullable FK → albums.id
        'graduation_photo_id',  // nullable FK → graduation_photos.id
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

    /**
     * The specific graduation photo/video this transcript belongs to.
     * Nullable — older transcripts only have album_id.
     */
    public function graduationPhoto(): BelongsTo
    {
        return $this->belongsTo(GraduationPhoto::class, 'graduation_photo_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title',            'like', "%{$term}%")
              ->orWhere('transcript_text', 'like', "%{$term}%")
              ->orWhere('notes',           'like', "%{$term}%");
        });
    }

    public function scopeDone(Builder $query): Builder
    {
        return $query->where('status', 'done');
    }

    /**
     * Filter by a specific graduation photo/video.
     * Falls back to album_id filter for legacy transcripts.
     */
    public function scopeByPhoto(Builder $query, int $photoId): Builder
    {
        return $query->where('graduation_photo_id', $photoId);
    }

    /**
     * Filter by album — used for legacy transcripts that only have album_id
     * and no graduation_photo_id yet.
     */
    public function scopeByAlbum(Builder $query, int $albumId): Builder
    {
        return $query->where('album_id', $albumId);
    }

    /**
     * Transcripts visible to a given user:
     *   - Their own manually-uploaded transcripts (any status)
     *   - All auto-generated transcripts with status 'done'
     */
    public function scopeVisibleTo(Builder $query, int $userId): Builder
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('uploaded_by', $userId)
              ->orWhere(fn ($q2) => $q2
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