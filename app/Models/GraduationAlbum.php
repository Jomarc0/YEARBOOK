<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GraduationAlbum extends Model
{
    use SoftDeletes;

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
    // Relationships — all with explicit FK 'graduation_album_id' to match GraduationPhoto
    // =========================================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    /**
     * All media files in this album.
     * FK: graduation_album_id (GraduationPhoto.graduation_album_id → graduation_albums.id)
     */
    public function photos(): HasMany
    {
        return $this->hasMany(GraduationPhoto::class, 'graduation_album_id')->orderBy('sort_order');
    }

    public function mediaFiles(): HasMany
    {
        return $this->hasMany(GraduationPhoto::class, 'graduation_album_id')->orderBy('sort_order');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(GraduationPhoto::class, 'graduation_album_id')
            ->where('resource_type', 'video')
            ->orderBy('sort_order');
    }

    public function audios(): HasMany
    {
        return $this->hasMany(GraduationPhoto::class, 'graduation_album_id')
            ->where('resource_type', 'audio')
            ->orderBy('sort_order');
    }

    // =========================================================================
    // Scopes
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
    // Accessors
    // =========================================================================

    public function getCoverPhotoUrlAttribute(): ?string
    {
        if ($this->cover_image) return $this->cover_image;

        $first = $this->photos()
            ->where('resource_type', 'image')
            ->orderBy('sort_order')
            ->first();

        return $first?->file_path ?? $this->media_url;
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    public function isPublished(): bool { return $this->status === 'published'; }
    public function isDraft(): bool     { return $this->status === 'draft'; }
    public function isArchived(): bool  { return $this->status === 'archived'; }

    public function publish(): bool
    {
        return $this->update(['status' => 'published', 'published_at' => now()]);
    }

    public function archive(): bool
    {
        return $this->update(['status' => 'archived']);
    }
}
