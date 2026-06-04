<?php

namespace App\Models;

use App\Contracts\AnalyzablePhoto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GraduationPhoto extends Model implements AnalyzablePhoto
{
    use SoftDeletes;

    protected $fillable = [
        'graduation_album_id',
        'file_path',
        'cloudinary_public_id',
        'resource_type',
        'mime_type',
        'ai_metadata',
        'sort_order',
    ];

    protected $casts = [
        'ai_metadata' => 'array',
        'sort_order'  => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function album(): BelongsTo
    {
        return $this->belongsTo(GraduationAlbum::class, 'graduation_album_id');
    }

    /**
     * Reuses the same TaggedPhoto model via a separate FK column.
     * Requires: tagged_photos.graduation_photo_id (nullable, add via migration below)
     */
    public function taggedPhotos(): HasMany
    {
        return $this->hasMany(TaggedPhoto::class, 'graduation_photo_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeImages(Builder $query): Builder
    {
        return $query->where('resource_type', 'image');
    }

    public function scopeVideos(Builder $query): Builder
    {
        return $query->where('resource_type', 'video');
    }

    public function scopeAudio(Builder $query): Builder
    {
        return $query->where('resource_type', 'audio');
    }

    public function scopeDocuments(Builder $query): Builder
    {
        return $query->where('resource_type', 'raw');
    }

    // ── Accessors / Helpers ────────────────────────────────────────────────

    public function getFileTypeAttribute(): string
    {
        $mime = $this->mime_type ?? '';
        $path = $this->file_path ?? '';

        if (str_starts_with($mime, 'image/') || preg_match('/\.(jpg|jpeg|png|webp|gif)(\?|$)/i', $path)) {
            return 'image';
        }
        if (str_starts_with($mime, 'video/') || preg_match('/\.(mp4|mov|webm|avi|mkv)(\?|$)/i', $path)) {
            return 'video';
        }
        if (str_starts_with($mime, 'audio/') || preg_match('/\.(mp3|wav|m4a|ogg|flac)(\?|$)/i', $path)) {
            return 'audio';
        }
        if ($mime === 'application/pdf' || preg_match('/\.pdf(\?|$)/i', $path)) {
            return 'pdf';
        }

        return 'file';
    }

    public function isAiPending(): bool
    {
        return ($this->ai_metadata['status'] ?? 'pending') === 'pending';
    }

    public function markAiError(string $message): bool
    {
        $meta                = $this->ai_metadata ?? [];
        $meta['status']      = 'error';
        $meta['error']       = $message;
        $meta['analyzed_at'] = now()->toIso8601String();

        return $this->update(['ai_metadata' => $meta]);
    }

    public function isAiQueued(): bool
    {
        return ($this->ai_metadata['status'] ?? '') === 'queued';
    }

    public function markAiQueued(): bool
    {
        $meta           = $this->ai_metadata ?? [];
        $meta['status'] = 'queued';

        return $this->update(['ai_metadata' => $meta]);
    }

    public function markAiDone(array $results = []): bool
    {
        $meta           = $this->ai_metadata ?? [];
        $meta['status'] = 'done';
        $meta           = array_merge($meta, $results);

        return $this->update(['ai_metadata' => $meta]);
    }
}