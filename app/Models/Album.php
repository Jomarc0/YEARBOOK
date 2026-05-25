<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Album extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'cover_image',
        'event_date',
        'type',                  // general | graduation | profile
        'category',              // photos | videos | program | archive
        'media_url',             // for single-media albums (video/PDF)
        'cloudinary_public_id',
    ];

    protected $casts = [
        'event_date' => 'date',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    /**
     * Cover photo URL — uses cover_image if set, otherwise first photo.
     */
    public function getCoverPhotoUrlAttribute(): ?string
    {
        if ($this->cover_image) {
            return $this->cover_image;
        }
        return $this->photos()->latest()->value('file_path');
    }

    /**
     * Photos count accessor (avoids N+1 when withCount is not loaded).
     */
    public function getPhotoCountAttribute(): int
    {
        return $this->photos_count ?? $this->photos()->count();
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeGraduation($query)
    {
        return $query->where('type', 'graduation');
    }

    public function scopeGeneral($query)
    {
        return $query->where('type', 'general');
    }
}