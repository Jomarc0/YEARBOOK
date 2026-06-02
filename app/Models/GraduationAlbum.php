<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class GraduationAlbum extends Model
{
    protected $fillable = [
        'user_id',
        'batch_id',
        'title',
        'description',
        'category',
        'status',
        'media_url',
        'cover_image',
        'cloudinary_public_id',
        'event_date',
        'published_at',
    ];

    protected $casts = [
        'event_date'   => 'date',
        'published_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * The admin who created this album.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The batch this album belongs to.
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    /**
     * All files (photos, videos, audio, PDFs) in this album.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(GraduationPhoto::class)->orderBy('sort_order');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', 'archived');
    }

    public function scopeOfCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeForBatch(Builder $query, int $batchId): Builder
    {
        return $query->where('batch_id', $batchId);
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    /**
     * Best available thumbnail URL for this album.
     * Priority: cover_image → first photo → media_url
     */
    public function getCoverPhotoUrlAttribute(): ?string
    {
        if ($this->cover_image) {
            return $this->cover_image;
        }

        $first = $this->photos()
            ->where('resource_type', 'image')
            ->orderBy('sort_order')
            ->first();

        return $first?->file_path ?? $this->media_url;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    /**
     * Publish the album.
     */
    public function publish(): bool
    {
        return $this->update([
            'status'       => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Archive the album.
     */
    public function archive(): bool
    {
        return $this->update(['status' => 'archived']);
    }
}