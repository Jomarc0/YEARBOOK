<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Album extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'batch_id', 'title', 'description',
        'cover_image', 'event_date', 'type', 'category',
        'media_url', 'cloudinary_public_id', 'status', 'published_at',
        'approved_at', 'approved_by',
        'rejected_at', 'rejected_by',
        'rejection_reason', // ← added: set by MediaModerationController::rejectAlbum()
        'cover_url',
    ];

    protected $casts = [
        'event_date'   => 'date',
        'published_at' => 'datetime',
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

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getCoverPhotoUrlAttribute(): ?string
    {
        if ($this->cover_image) {
            return $this->cover_image;
        }
        return $this->photos()->latest()->value('file_path');
    }

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